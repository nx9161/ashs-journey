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
  echo "[6/8] live URL reachability — SKIPPED (Track B blocked: no deployment provisioned)"
  echo "[7/8] auth round-trip (register/login/logout) — SKIPPED (Track B blocked)"
  echo "[8/8] cloud save round-trip (hotel-phone test) — SKIPPED (Track B blocked)"
  echo ""
  echo "verify-live: LOCAL gates green. Live steps pending Track B unblock."
  echo "(Set LIVE_URL and provision per api/README.md to enable steps 6-8.)"
  exit 0
fi

echo "[6/8] live URL: $LIVE_URL"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$LIVE_URL")
test "$code" = "200" || { echo "FAIL: HTTP $code"; exit 1; }
echo "      OK (HTTP 200)"

echo "[7/8] auth round-trip — TODO: seeded test accounts (see phase3-pentest.md plan)"
echo "[8/8] cloud save round-trip — TODO: hotel-phone test (see drawers/phase2-architecture.md)"
