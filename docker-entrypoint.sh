#!/usr/bin/env bash
set -euo pipefail

APP_HOME="/app"
PGDATA="${PGDATA:-/var/lib/postgresql/data}"
PG_CTL="/usr/lib/postgresql/15/bin/pg_ctl"
INITDB="/usr/lib/postgresql/15/bin/initdb"
CREATEUSER="/usr/lib/postgresql/15/bin/createuser"
CREATEDB="/usr/lib/postgresql/15/bin/createdb"
RUNUSER_BIN="$(command -v runuser || true)"
RUNUSER="/usr/sbin/runuser"

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-prospect_portal}"

DEFAULT_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}"
export DATABASE_URL="${DATABASE_URL:-$DEFAULT_DATABASE_URL}"

ensure_permissions() {
  mkdir -p "${PGDATA}"
  chown -R postgres:postgres "${PGDATA}" /var/run/postgresql
  chmod 775 /var/run/postgresql
  chown -R node:node "${APP_HOME}"
}

escape_sql_literal() {
  printf "%s" "$1" | sed "s/'/''/g"
}

run_as_user() {
  local user="$1"
  shift || true

  if [[ -n "${RUNUSER_BIN}" ]]; then
    "${RUNUSER_BIN}" -u "${user}" -- "$@"
  else
    local shell_cmd=""
    if [[ $# -gt 0 ]]; then
      printf -v shell_cmd ' %q' "$@"
    fi
    su "${user}" -s /bin/sh -c "exec${shell_cmd}"
  fi
}

run_as_postgres() {
  run_as_user postgres "$@"
}

run_as_node() {
  run_as_user node "$@"
}

exec_as_node() {
  if [[ -n "${RUNUSER_BIN}" ]]; then
    exec "${RUNUSER_BIN}" -u node -- "$@"
  else
    local shell_cmd=""
    if [[ $# -gt 0 ]]; then
      printf -v shell_cmd ' %q' "$@"
    fi
    exec su node -s /bin/sh -c "exec${shell_cmd}"
  fi
}

start_postgres_once() {
  if [[ ! -s "${PGDATA}/PG_VERSION" ]]; then
    echo "Initializing bundled PostgreSQL cluster..."
    run_as_postgres "${INITDB}" -D "${PGDATA}" >/dev/null
start_postgres_once() {
  if [[ ! -s "${PGDATA}/PG_VERSION" ]]; then
    echo "Initializing bundled PostgreSQL cluster..."
    su postgres -c "${INITDB} -D '${PGDATA}'" >/dev/null

    # Secure local connections using password authentication.
    echo "host all all 0.0.0.0/0 scram-sha-256" >>"${PGDATA}/pg_hba.conf"
    echo "listen_addresses='*'" >>"${PGDATA}/postgresql.conf"

    run_as_postgres "${PG_CTL}" -D "${PGDATA}" -o "-p 5432" -w start

    local escaped_password
    escaped_password="$(escape_sql_literal "${POSTGRES_PASSWORD}")"

    if [[ "${POSTGRES_USER}" != "postgres" ]]; then
      run_as_postgres "${CREATEUSER}" --if-not-exists --login --createdb "${POSTGRES_USER}" >/dev/null || true
    fi

    run_as_postgres psql --command "ALTER ROLE \"\"${POSTGRES_USER}\"\" WITH LOGIN PASSWORD '${escaped_password}';" >/dev/null || true
    run_as_postgres "${CREATEDB}" --if-not-exists --owner="${POSTGRES_USER}" "${POSTGRES_DB}" >/dev/null || true
    su postgres -c "${PG_CTL} -D '${PGDATA}' -o '-p 5432' -w start"

    su postgres -c "psql --command \"ALTER USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';\"" >/dev/null || true
    if [[ "${POSTGRES_USER}" != "postgres" ]]; then
      su postgres -c "psql --command \"DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname='${POSTGRES_USER}') THEN CREATE ROLE ${POSTGRES_USER} LOGIN PASSWORD '${POSTGRES_PASSWORD}'; END IF; END $$;\"" >/dev/null
    fi

    su postgres -c "psql --command \"CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};\"" >/dev/null || true

    echo "Applying database schema via drizzle-kit push..."
    (cd "${APP_HOME}" && npm run db:push >/dev/null)

    run_as_postgres "${PG_CTL}" -D "${PGDATA}" -m fast stop >/dev/null
    su postgres -c "${PG_CTL} -D '${PGDATA}' -m fast stop" >/dev/null
  fi
}

start_postgres() {
  run_as_postgres "${PG_CTL}" -D "${PGDATA}" -o "-p 5432" -w start
}

stop_postgres() {
  run_as_postgres "${PG_CTL}" -D "${PGDATA}" -m fast stop >/dev/null || true
  su postgres -c "${PG_CTL} -D '${PGDATA}' -o '-p 5432 -c listen_addresses=\'*\' -c timezone=\'UTC\'' -w start"
}

stop_postgres() {
  su postgres -c "${PG_CTL} -D '${PGDATA}' -m fast stop" >/dev/null || true
}

run_npm_script() {
  local script_name="$1"
  (cd "${APP_HOME}" && run_as_node npm run "${script_name}")
  if command -v runuser >/dev/null 2>&1; then
    ${RUNUSER} -u node -- bash -lc "cd '${APP_HOME}' && npm run ${script_name}"
  else
    su node -s /bin/bash -c "cd '${APP_HOME}' && npm run ${script_name}"
  fi
}

ensure_permissions
start_postgres_once
start_postgres
trap stop_postgres EXIT INT TERM

if [[ "${SEED_SAMPLE_DATA:-false}" == "true" ]]; then
  echo "Seeding bundled PostgreSQL instance with sample data..."
  if ! run_npm_script seed:samples; then
    echo "Sample data seeding failed" >&2
    exit 1
  fi
fi

if [[ "${RUN_INTEGRATION_TESTS:-false}" == "true" ]]; then
  echo "Running integration smoke tests before launching the application..."
  if ! run_npm_script test:integrations; then
    echo "Integration tests reported failures" >&2
    exit 1
  fi
fi

echo "Starting application with DATABASE_URL configured"

cd "${APP_HOME}"
exec_as_node "$@"
if command -v runuser >/dev/null 2>&1; then
  exec ${RUNUSER} -u node -- "$@"
else
  exec su node -s /bin/bash -c "cd '${APP_HOME}' && exec \"$*\""
fi
