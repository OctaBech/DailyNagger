#!/usr/bin/env bash
set -euo pipefail

# CI-only: exercises the real backup and restore commands against disposable SQL.
[[ "${CI:-}" == true && "$(uname -s)" == Linux ]] || {
  echo "This integration test runs only on a Linux CI runner." >&2
  exit 2
}

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
test_root="$(mktemp -d)"
export COMPOSE_PROJECT_NAME="dailynagger-restore-${GITHUB_RUN_ID:-local}"
trap 'docker compose -f "$test_root/compose.prod.yaml" down -v --remove-orphans' EXIT

mkdir -p "$test_root/deploy" "$test_root/caddy-state"
cp "$repo_root/deploy/Caddyfile.maintenance" "$test_root/deploy/"
cp "$repo_root/deploy/Caddyfile.maintenance" "$test_root/caddy-state/Caddyfile"
cat > "$test_root/.env" <<'ENV'
MSSQL_SA_PASSWORD=DailyNagger_CI_Restore_12345
ENV
cat > "$test_root/compose.prod.yaml" <<'COMPOSE'
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "${MSSQL_SA_PASSWORD}"
    volumes:
      - sql-data:/var/opt/mssql
  staging-sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      MSSQL_SA_PASSWORD: "${MSSQL_SA_PASSWORD}"
    volumes:
      - demo-sql-data:/var/opt/mssql
  server:
    image: busybox:1.36
    command: ["true"]
volumes:
  sql-data:
  demo-sql-data:
COMPOSE

cd "$test_root"
docker compose -f compose.prod.yaml up -d sqlserver staging-sqlserver
export DAILY_NAGGER_DEMO_SQL_CONTAINER="$(docker compose -f compose.prod.yaml ps -q staging-sqlserver)"
test -n "$DAILY_NAGGER_DEMO_SQL_CONTAINER"

sql() {
  local service="$1"
  local query="$2"
  docker compose -f compose.prod.yaml exec -T "$service" bash -c '
    exec /opt/mssql-tools18/bin/sqlcmd -S localhost -d master -U sa \
      -P "$MSSQL_SA_PASSWORD" -C -b -Q "$1"
  ' _ "$query"
}

for service in sqlserver staging-sqlserver; do
  ready=false
  for _ in {1..60}; do
    if sql "$service" "SELECT 1" > /dev/null 2>&1; then
      ready=true
      break
    fi
    sleep 2
  done
  [[ "$ready" == true ]] || { echo "Test SQL Server did not start: $service" >&2; exit 1; }
done

for database in DailyNaggerData DailyNaggerControl; do
  sql sqlserver "CREATE DATABASE [$database]"
  sql sqlserver "USE [$database]; CREATE TABLE dbo.ReleaseProbe (Value int NOT NULL); INSERT INTO dbo.ReleaseProbe VALUES (1)"
done
sql staging-sqlserver "CREATE DATABASE [DailyNaggerData]"
sql staging-sqlserver "USE [DailyNaggerData]; CREATE TABLE dbo.ReleaseProbe (Value int NOT NULL); INSERT INTO dbo.ReleaseProbe VALUES (1)"

stamp=20260929-120000
bash "$repo_root/deploy/production-db-backup-restore.sh" backup "$stamp" "$test_root"

for database in DailyNaggerData DailyNaggerControl; do
  sql sqlserver "USE [$database]; INSERT INTO dbo.ReleaseProbe VALUES (2)"
done
sql staging-sqlserver "USE [DailyNaggerData]; INSERT INTO dbo.ReleaseProbe VALUES (2)"

bash "$repo_root/deploy/production-db-backup-restore.sh" restore "$stamp" "$test_root"

for database in DailyNaggerData DailyNaggerControl; do
  sql sqlserver "USE [$database]; IF (SELECT COUNT(*) FROM dbo.ReleaseProbe) <> 1 OR (SELECT MIN(Value) FROM dbo.ReleaseProbe) <> 1 THROW 50000, 'Restore did not recover the backup', 1"
done
sql staging-sqlserver "USE [DailyNaggerData]; IF (SELECT COUNT(*) FROM dbo.ReleaseProbe) <> 1 OR (SELECT MIN(Value) FROM dbo.ReleaseProbe) <> 1 THROW 50000, 'Demo restore did not recover the backup', 1"

echo "All three disposable SQL databases were restored to their backup contents."
