#!/usr/bin/env bash
# Restore a pg_dump custom-format file into local smartlance DB.
# Usage: ./scripts/db/restore-to-local.sh [path-to.dump]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:${PATH:-}"

DUMP="${1:-tmp/db-migrate/smartlance_neon.dump}"
if [[ ! -s "$DUMP" ]]; then
  echo "Dump not found or empty: $DUMP" >&2
  exit 1
fi

DB_URL="${DATABASE_URL:-postgresql://abiodun@localhost:5432/smartlance}"
# Force local target safety
if [[ "$DB_URL" != *"localhost"* && "$DB_URL" != *"127.0.0.1"* ]]; then
  echo "Refusing restore: DATABASE_URL is not local. Export a local DATABASE_URL first." >&2
  exit 1
fi

echo "Dropping and recreating local database smartlance..."
dropdb --if-exists smartlance
createdb smartlance
echo "Restoring $DUMP ..."
pg_restore --no-owner --no-acl -d smartlance "$DUMP" || true
echo "Running prisma migrate deploy to catch any newer migrations..."
export DATABASE_URL="postgresql://abiodun@localhost:5432/smartlance"
export DIRECT_URL="$DATABASE_URL"
npx prisma migrate deploy
echo "Restore complete."
