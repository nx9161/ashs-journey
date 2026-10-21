// resolve-hooks.mjs — Node module customization hooks for the Track B
// integration suite. Redirects the bare specifier `pg` (imported by
// api/_lib/db.mjs) to tests/pg-stub.mjs, a PGlite-backed drop-in for
// pg.Pool. No production code is modified; the hook lives only in this
// test run (registered by register.mjs before any api/ module loads).
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'pg') {
    return {
      url: new URL('./pg-stub.mjs', import.meta.url).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
