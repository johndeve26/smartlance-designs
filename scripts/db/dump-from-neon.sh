#!/usr/bin/env bash
# Dump Neon into tmp/db-migrate/smartlance_neon.dump (custom format).
# Prefers NEON_DIRECT_URL, then NEON_DATABASE_URL, then DATABASE_URL if host contains neon.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
mkdir -p tmp/db-migrate
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:${PATH:-}"

# shellcheck disable=SC1091
set -a
# Load without printing
source <(grep -E '^(NEON_DIRECT_URL|NEON_DATABASE_URL|DATABASE_URL|DIRECT_URL)=' .env.local 2>/dev/null | sed 's/^/export /' || true)
set +a

URL="${NEON_DIRECT_URL:-${NEON_DATABASE_URL:-}}"
if [[ -z "${URL}" ]]; then
  if [[ "${DATABASE_URL:-}" == *"neon.tech"* ]]; then
    URL="$DATABASE_URL"
  elif [[ "${DIRECT_URL:-}" == *"neon.tech"* ]]; then
    URL="$DIRECT_URL"
  fi
fi

if [[ -z "${URL}" ]]; then
  echo "No Neon URL found (set NEON_DIRECT_URL or NEON_DATABASE_URL in .env.local)." >&2
  exit 1
fi

OUT="tmp/db-migrate/smartlance_neon.dump"
echo "Dumping Neon → ${OUT} (this may take a while if the project is waking)..."
PGCONNECT_TIMEOUT=90 pg_dump "$URL" --no-owner --no-acl -F c -f "$OUT"
echo "OK ($(wc -c < "$OUT") bytes)"
