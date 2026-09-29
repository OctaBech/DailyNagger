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
  server:
    image: busybox:1.36
    command: ["true"]
volumes:
  sql-data:
COMPOSE

cd "$test_root"
docker compose -f compose.prod.yaml up -d sqlserver

sql() {
  docker compose -f compose.prod.yaml exec -T sqlserver bash -c '
    exec /opt/mssql-tools18/bin/sqlcmd -S localhost -d master -U sa \
      -P "$MSSQL_SA_PASSWORD" -C -b -Q "$1"
  ' _ "$1"
}

ready=false
for _ in {1..60}; do
  if sql "SELECT 1" > /dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 2
done
[[ "$ready" == true ]] || { echo "Test SQL Server did not start." >&2; exit 1; }

for database in DailyNaggerData DailyNaggerControl; do
  sql "CREATE DATABASE [$database]"
  sql "USE [$database]; CREATE TABLE dbo.ReleaseProbe (Value int NOT NULL); INSERT INTO dbo.ReleaseProbe VALUES (1)"
done

stamp=20260929-120000
bash "$repo_root/deploy/production-db-backup-restore.sh" backup "$stamp" "$test_root"

for database in DailyNaggerData DailyNaggerControl; do
  sql "USE [$database]; INSERT INTO dbo.ReleaseProbe VALUES (2)"
done

bash "$repo_root/deploy/production-db-backup-restore.sh" restore "$stamp" "$test_root"

for database in DailyNaggerData DailyNaggerControl; do
  sql "USE [$database]; IF (SELECT COUNT(*) FROM dbo.ReleaseProbe) <> 1 OR (SELECT MIN(Value) FROM dbo.ReleaseProbe) <> 1 THROW 50000, 'Restore did not recover the backup', 1"
done

echo "Both disposable SQL databases were restored to their backup contents."
