// 01 — migration + RLS fail-closed / isolation, SQL level (PGlite).
// Oracle: migrations/001_track_b.sql + phase2-rls-resolution §1 (option a).
import { getPGlite } from '../pg-stub.mjs';
import { t } from '../harness.mjs';

export async function run() {
  const pg = getPGlite();

  // --- migration shape ---
  const tbl = await pg.query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`);
  const names = tbl.rows.map((r) => r.tablename);
  for (const need of ['user', 'session', 'account', 'verification', 'rateLimit',
    'saves', 'recovery_codes', 'rate_limits', 'anomaly_log']) {
    t(`migration: table ${need} exists`, names.includes(need));
  }

  // C6(iv): user.id is text (the sketch's assumption, verified).
  const idtype = await pg.query(
    `SELECT data_type FROM information_schema.columns WHERE table_name='user' AND column_name='id'`);
  t('C6(iv): user.id type is text', idtype.rows[0] && idtype.rows[0].data_type === 'text');

  // RLS enabled + FORCED on saves / recovery_codes.
  const rls = await pg.query(
    `SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class
     WHERE relname IN ('saves','recovery_codes')`);
  for (const r of rls.rows) {
    t(`RLS enabled on ${r.relname}`, r.relrowsecurity === true);
    t(`RLS FORCED on ${r.relname}`, r.relforcerowsecurity === true);
  }
  const pol = await pg.query(
    `SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' ORDER BY tablename`);
  t('policy saves_isolation exists',
    pol.rows.some((r) => r.tablename === 'saves' && r.policyname === 'saves_isolation'));
  t('policy recovery_codes_isolation exists',
    pol.rows.some((r) => r.tablename === 'recovery_codes' && r.policyname === 'recovery_codes_isolation'));

  // CHECK constraints present on saves (slot range, 64KB, version floor).
  const chk = await pg.query(
    `SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
     WHERE conrelid='saves'::regclass AND contype='c'`);
  const defs = chk.rows.map((r) => r.def).join(' | ');
  t('saves: slot 1..3 CHECK', /slot >= 1/.test(defs) && /slot <= 3/.test(defs), defs);
  t('saves: 64KB payload CHECK', /octet_length\(\(payload\)::text\) <= 65536/.test(defs), defs);
  t('saves: version >= 1 CHECK', /version >= 1/.test(defs), defs);

  // --- seed two users + rows, WITH the var set (simulating the API) ---
  const seed = async (uid, name) => {
    await pg.query(`INSERT INTO "user" (id, name, email, "emailVerified", username)
      VALUES ($1, $2, $3, false, $4)`, [uid, name, `${name}@game.local`, name]);
    await pg.query(`SELECT set_config('app.user_id', $1, false)`, [uid]);
    await pg.query(
      `INSERT INTO saves (user_id, slot, payload, schema_version, version)
       VALUES ($1, 1, '{"v":1}'::jsonb, 1, 1)`, [uid]);
    await pg.query(
      `INSERT INTO recovery_codes (user_id, code_hash) VALUES ($1, 'x')`, [uid]);
  };
  await seed('user-a', 'rls_a');
  await seed('user-b', 'rls_b');

  // --- (a) RLS fail-closed: NO var set -> zero rows ---
  // migrate.mjs did SET ROLE app_role (production parity). RLS is enforced
  // for app_role (FORCE). RESET truly unsets the var (set_config NULL would
  // set empty-string — a PGlite/Postgres quirk; RESET is the honest clear).
  await pg.query(`RESET app.user_id`);
  const noVar1 = await pg.query(`SELECT count(*)::int AS c FROM saves`);
  t('(a) saves: zero rows without app.user_id', noVar1.rows[0].c === 0, 'got ' + noVar1.rows[0].c);
  const noVar2 = await pg.query(`SELECT count(*)::int AS c FROM recovery_codes`);
  t('(a) recovery_codes: zero rows without app.user_id', noVar2.rows[0].c === 0);
  const updNoVar = await pg.query(`UPDATE saves SET version=99 WHERE slot=1`);
  t('(a) UPDATE without var touches 0 rows', updNoVar.affectedRows === 0, 'affected=' + updNoVar.affectedRows);
  const delNoVar = await pg.query(`DELETE FROM saves WHERE slot=1`);
  t('(a) DELETE without var touches 0 rows', delNoVar.affectedRows === 0, 'affected=' + delNoVar.affectedRows);

  // --- (b) set_config scoping isolates the two users ---
  await pg.query(`SELECT set_config('app.user_id', 'user-a', false)`);
  const aRows = await pg.query(`SELECT user_id, slot FROM saves ORDER BY user_id`);
  t('(b) var=user-a sees only user-a rows',
    aRows.rows.length === 1 && aRows.rows[0].user_id === 'user-a',
    JSON.stringify(aRows.rows));
  // Cross-user write is denied by WITH CHECK even if the row were visible.
  const crossUpd = await pg.query(`UPDATE saves SET version=42 WHERE user_id='user-b' AND slot=1`);
  t('(b) var=user-a cannot UPDATE user-b row', crossUpd.affectedRows === 0, 'affected=' + crossUpd.affectedRows);
  await pg.query(`SELECT set_config('app.user_id', 'user-b', false)`);
  const bRows = await pg.query(`SELECT user_id FROM saves`);
  t('(b) var=user-b sees only user-b rows',
    bRows.rows.length === 1 && bRows.rows[0].user_id === 'user-b');

  // --- (g) 64KB CHECK enforcement at the DB gate ---
  await pg.query(`SELECT set_config('app.user_id', 'user-a', false)`);
  const big = 'x'.repeat(70000);
  let checkErr = null;
  try {
    await pg.query(`INSERT INTO saves (user_id, slot, payload, schema_version)
      VALUES ('user-a', 2, $1::jsonb, 1)`, [JSON.stringify({ pad: big })]);
  } catch (e) { checkErr = e; }
  t('(g) 64KB CHECK rejects oversized payload',
    !!checkErr && /check/i.test(checkErr.message || ''), checkErr && checkErr.message);

  // Cleanup seed rows for later suites (fresh users there anyway).
  await pg.query(`DELETE FROM saves`);
  await pg.query(`DELETE FROM recovery_codes`);
  await pg.query(`DELETE FROM "user"`);
  await pg.query(`RESET app.user_id`);
}
