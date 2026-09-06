#!/usr/bin/env bash
# Provision Postgres + PgBouncer for Smartlance on a Linux VPS.
# Run as root/sudo on the VPS. Does NOT open Postgres to the public internet by default.
#
# Usage:
#   sudo SMARTLANCE_DB_PASSWORD='...' ./vps-provision-postgres.sh
#
# Optional env:
#   SMARTLANCE_DB_USER (default: smartlance)
#   SMARTLANCE_DB_NAME (default: smartlance)
#   SMARTLANCE_DB_PASSWORD (required)
#   PGBOUNCER_PORT (default: 6432)
set -euo pipefail

DB_USER="${SMARTLANCE_DB_USER:-smartlance}"
DB_NAME="${SMARTLANCE_DB_NAME:-smartlance}"
DB_PASSWORD="${SMARTLANCE_DB_PASSWORD:-}"
PGBOUNCER_PORT="${PGBOUNCER_PORT:-6432}"

if [[ -z "$DB_PASSWORD" ]]; then
  echo "Set SMARTLANCE_DB_PASSWORD before running." >&2
  exit 1
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
if command -v apt-get >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y postgresql postgresql-contrib pgbouncer
elif command -v dnf >/dev/null 2>&1; then
  dnf install -y postgresql-server postgresql-contrib pgbouncer
  postgresql-setup --initdb || true
  systemctl enable --now postgresql
else
  echo "Unsupported distro: install postgresql + pgbouncer manually." >&2
  exit 1
fi

systemctl enable --now postgresql || true

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

# PgBouncer userlist
install -d -m 750 /etc/pgbouncer
cat > /etc/pgbouncer/userlist.txt <<EOF
"${DB_USER}" "${DB_PASSWORD}"
EOF
chmod 640 /etc/pgbouncer/userlist.txt
chown postgres:postgres /etc/pgbouncer/userlist.txt 2>/dev/null || chown pgbouncer:pgbouncer /etc/pgbouncer/userlist.txt 2>/dev/null || true

# Minimal pgbouncer.ini (transaction pooling for serverless)
PG_UNIX="$(sudo -u postgres psql -Atc "SHOW unix_socket_directories;" | awk '{print $1}')"
PG_UNIX="${PG_UNIX:-/var/run/postgresql}"

cat > /etc/pgbouncer/pgbouncer.ini <<EOF
[databases]
${DB_NAME} = host=${PG_UNIX} port=5432 dbname=${DB_NAME}

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = ${PGBOUNCER_PORT}
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
ignore_startup_parameters = extra_float_digits
admin_users = ${DB_USER}
EOF

systemctl enable --now pgbouncer || service pgbouncer restart || true

echo
echo "Provisioned."
echo "Direct URL (migrations):  postgresql://${DB_USER}:PASSWORD@127.0.0.1:5432/${DB_NAME}"
echo "Pooler URL (Vercel app):  postgresql://${DB_USER}:PASSWORD@127.0.0.1:${PGBOUNCER_PORT}/${DB_NAME}"
echo
echo "Next:"
echo "  1. Restore dump into ${DB_NAME}"
echo "  2. Tunnel or securely expose ${PGBOUNCER_PORT} to Vercel (Tailscale / firewall + SSL terminator)."
echo "  3. Set Vercel DATABASE_URL (pooler) and DIRECT_URL (5432)."
echo "  4. Run: DIRECT_URL=... npx prisma migrate deploy"
