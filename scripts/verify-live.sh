#!/usr/bin/env bash
# verify-live.sh — DevOps live-verification skeleton (8 steps, per Phase 2 challenge).
# Track B only: all live steps require a deployed Vercel project + provisioned backend.
# Until the Track B provisioning blockers clear (OQ-4 follow-up, OQ-10, OQ-18),
# this script verifies the LOCAL build artifacts and skips live checks honestly.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "== verify-live: Ash's Journey =="
echo "[1/8] build artifacts exist"
test -f "$ROOT/dist/standalone.html" || { echo "SKIP: dist/standalone.html missing (run scripts/build.mjs)"; exit 2; }
test -f "$ROOT/public/index.html" || { echo "SKIP: public/ not built"; exit 2; }
echo "      OK"

echo "[2/8] budget gates"
node "$ROOT/scripts/budgets-check.mjs"

echo "[3/8] contamination scan"
node "$ROOT/scripts/contamination-scan.mjs"

echo "[4/8] bundle drift gate"
node "$ROOT/scripts/drift-gate.mjs"

echo "[5/8] headless slice playthrough"
node "$ROOT/scripts/verify-slice.mjs"

# ---- live steps below require Track B (blocked) ----
if [ -z "${LIVE_URL:-}" ]; then
  echo "[6/8] live URL reachability — SKIPPED (set LIVE_URL to run)"
  echo "[7/8] auth round-trip (sign-up/sign-in/session) — SKIPPED (set LIVE_URL + LIVE_USER/LIVE_PASS)"
  echo "[8/8] cloud save route round-trip — SKIPPED (runs with step 7)"
  echo ""
  echo "verify-live: LOCAL gates green. Live steps ready; they verify the NEW"
  echo "build once the Vercel projects are git-linked (owner step: Settings -> Git"
  echo "-> Connect nx9161/ashs-journey on both projects)."
  exit 0
fi

echo "[6/8] live URL: $LIVE_URL"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$LIVE_URL")
test "$code" = "200" || { echo "FAIL: HTTP $code"; exit 1; }
echo "      OK (HTTP 200)"

# WS4 (2026-10-21): the full auth + save round-trip. This is the ONLY
# acceptable proof that logins work on a new build — it exercises the
# exact route that platform-404'd on the pre-git-link build
# (POST /api/auth/sign-in/username). Requires a throwaway account:
#   LIVE_USER / LIVE_PASS env (an account created for verification only).
# The smoke account is deleted via the API at the end when DELETE works.
echo "[7/8] auth round-trip (sign-up -> sign-in -> session)"
if [ -z "${LIVE_USER:-}" ] || [ -z "${LIVE_PASS:-}" ]; then
  echo "      SKIPPED (set LIVE_USER/LIVE_PASS to a throwaway account to run)"
else
  JAR=$(mktemp)
  BASE="${LIVE_URL%/}"
  health=$(curl -s --max-time 20 "$BASE/api/health")
  echo "      health: $health"
  echo "$health" | grep -q '"ok":true' || { echo "FAIL: health not ok"; exit 1; }
  # Sign up first (idempotent: an existing verification account is fine —
  # 200/201 = created; 400/409/422 with an account-taken code = already there).
  signup=$(curl -s -w "\n%{http_code}" --max-time 20 -X POST "$BASE/api/auth/signup" \
    -H 'content-type: application/json' \
    -d "{\"username\":\"$LIVE_USER\",\"password\":\"$LIVE_PASS\"}")
  ucode=$(echo "$signup" | tail -1)
  case "$ucode" in
    200|201) echo "      sign-up OK (HTTP $ucode, fresh verification account)" ;;
    400|409|422) echo "      sign-up: account already exists (HTTP $ucode) — continuing to sign-in" ;;
    *) echo "FAIL: POST /api/auth/signup -> HTTP $ucode"; exit 1 ;;
  esac
  # Sign in (the route under test). A 404 here = the routing defect.
  signin=$(curl -s -c "$JAR" -w "\n%{http_code}" --max-time 20 -X POST "$BASE/api/auth/sign-in/username" \
    -H 'content-type: application/json' \
    -d "{\"username\":\"$LIVE_USER\",\"password\":\"$LIVE_PASS\"}")
  scode=$(echo "$signin" | tail -1)
  test "$scode" = "200" || { echo "FAIL: POST /api/auth/sign-in/username -> HTTP $scode (routing defect if 404)"; exit 1; }
  echo "      sign-in OK (HTTP 200, session cookie set)"
  sess=$(curl -s -b "$JAR" --max-time 20 "$BASE/api/auth/get-session")
  echo "$sess" | grep -q "$LIVE_USER" || { echo "FAIL: session does not name the user"; exit 1; }
  echo "      session OK"

  echo "[8/8] cloud save route round-trip (list + validator probe)"
  list=$(curl -s -b "$JAR" -w "\n%{http_code}" --max-time 20 "$BASE/api/save")
  lcode=$(echo "$list" | tail -1)
  test "$lcode" = "200" || { echo "FAIL: GET /api/save -> HTTP $lcode"; exit 1; }
  echo "      save list OK (HTTP 200)"
  # A structurally invalid payload must be rejected 422 by the hand-rolled
  # validator — proves the route, the session, and validation are all live
  # without fabricating a fake game state.
  probe=$(curl -s -b "$JAR" -w "\n%{http_code}" --max-time 20 -X PUT "$BASE/api/save" \
    -H 'content-type: application/json' \
    -d '{"slot":1,"payload":{"v":1,"bogus":true},"expectedVersion":0}')
  pcode=$(echo "$probe" | tail -1)
  test "$pcode" = "422" || { echo "FAIL: PUT invalid save -> HTTP $pcode (expected 422)"; exit 1; }
  echo "      validator probe OK (422 on invalid payload)"
  rm -f "$JAR"
fi
echo ""
echo "verify-live: DONE"
