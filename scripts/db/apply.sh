#!/bin/sh
# Applies supabase/migrations/*.sql (lexical order) then supabase/seed.sql, if it
# exists, against the compose Postgres. Run by the one-shot `migrate` service.
#
# Re-run safe: every file is recorded in public._compose_migrations and skipped on
# later runs, so `docker compose up` after a plain restart is a no-op. A full
# re-seed needs `docker compose down -v` (fresh volume).
set -eu

DB_URL="${DATABASE_URL:?DATABASE_URL is required}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-/supabase/migrations}"
SEED_FILE="${SEED_FILE:-/supabase/seed.sql}"

psql_do() {
  psql "$DB_URL" -v ON_ERROR_STOP=1 --no-psqlrc --quiet "$@"
}

# GoTrue owns and migrates the `auth` schema; the profiles migration FKs to
# auth.users and puts a trigger on it. `migrate` already waits for the `auth`
# service to be healthy, but re-check here so a slow migration can't race us.
echo "[apply] waiting for auth.users (GoTrue migration) ..."
i=0
while [ "$(psql "$DB_URL" -tAc "select to_regclass('auth.users') is not null" 2>/dev/null || echo f)" != "t" ]; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "[apply] auth.users never appeared after ~2 min — is the auth service healthy?" >&2
    exit 1
  fi
  sleep 2
done
echo "[apply] auth.users present."

psql_do -c "create table if not exists public._compose_migrations (
  filename   text primary key,
  applied_at timestamptz not null default now()
);"

applied() {
  [ "$(psql "$DB_URL" -tAc "select 1 from public._compose_migrations where filename = '$1'")" = "1" ]
}
record() {
  psql_do -c "insert into public._compose_migrations (filename) values ('$1') on conflict do nothing;"
}

for f in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
  name=$(basename "$f")
  if applied "$name"; then
    echo "[apply] skip $name (already applied)"
    continue
  fi
  echo "[apply] migrate $name"
  psql_do --single-transaction -f "$f"
  record "$name"
done

if [ -f "$SEED_FILE" ]; then
  if applied "seed.sql"; then
    echo "[apply] skip seed.sql (already applied — 'docker compose down -v' to re-seed)"
  else
    echo "[apply] seed seed.sql"
    psql_do --single-transaction -f "$SEED_FILE"
    record "seed.sql"
  fi
else
  echo "[apply] no $SEED_FILE yet (added in Phase 3) — skipping seed"
fi

echo "[apply] done."
