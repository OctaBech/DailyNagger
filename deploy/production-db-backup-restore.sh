#!/usr/bin/env bash
set -euo pipefail
umask 077

# Run on the VPS only while Caddy is in maintenance mode and the API is stopped.
# Usage: bash deploy/production-db-backup-restore.sh backup|restore <UTC-stamp> [deploy-dir]
operation="${1:?Expected backup or restore}"
stamp="${2:?Expected a UTC stamp such as 20260929-120000}"
deploy_dir="${3:-/opt/dailynagger}"

[[ "$stamp" =~ ^[0-9]{8}-[0-9]{6}$ ]] || {
  echo "Invalid backup stamp." >&2
  exit 2
}
case "$operation" in
  backup|restore) ;;
  *) echo "Expected backup or restore." >&2; exit 2 ;;
esac

cd "$deploy_dir"
test -f compose.prod.yaml
test -f .env
cmp -s caddy-state/Caddyfile deploy/Caddyfile.maintenance || {
  echo "Refusing database operation: Caddy is not in maintenance mode." >&2
  exit 1
}

compose=(docker compose -f compose.prod.yaml)
server_id="$("${compose[@]}" ps -q server)"
if [[ -n "$server_id" && "$(docker inspect -f '{{.State.Running}}' "$server_id")" == true ]]; then
  echo "Refusing database operation while the API is running." >&2
  exit 1
fi

container_dir="/var/opt/mssql/backup/$stamp"
backup_dir="$deploy_dir/backups/$stamp"
production_container="$("${compose[@]}" ps -q sqlserver)"
demo_container="${DAILY_NAGGER_DEMO_SQL_CONTAINER:-dailynagger-staging-sqlserver}"
test -n "$production_container"
for container in "$production_container" "$demo_container"; do
  test "$(docker inspect -f '{{.State.Running}}' "$container")" = true || {
    echo "SQL Server container is not running: $container" >&2
    exit 1
  }
done

# The demo database has the same SQL name on a separate SQL Server.
containers=("$production_container" "$production_container" "$demo_container")
databases=(DailyNaggerData DailyNaggerControl DailyNaggerData)
backup_names=(DailyNaggerData DailyNaggerControl DemoDailyNaggerData)

sql() {
  local container="$1"
  local query="$2"
  docker exec "$container" bash -c '
    exec /opt/mssql-tools18/bin/sqlcmd -S localhost -d master -U sa \
      -P "$MSSQL_SA_PASSWORD" -C -b -Q "$1"
  ' _ "$query"
}

if [[ "$operation" == backup ]]; then
  [[ ! -e "$backup_dir" ]] || {
    echo "Backup directory already exists: $backup_dir" >&2
    exit 1
  }
  mkdir -m 700 -p "$backup_dir"

  for index in "${!databases[@]}"; do
    database="${databases[$index]}"
    container_id="${containers[$index]}"
    file="${backup_names[$index]}-$stamp.bak"
    container_file="$container_dir/$file"
    host_file="$backup_dir/$file"
    docker exec "$container_id" mkdir -p "$container_dir"
    sql "$container_id" "BACKUP DATABASE [$database] TO DISK = N'$container_file' WITH INIT, COMPRESSION, CHECKSUM"
    sql "$container_id" "RESTORE VERIFYONLY FROM DISK = N'$container_file' WITH CHECKSUM"
    docker cp "$container_id:$container_file" "$host_file"
    test -s "$host_file"
    chmod 600 "$host_file"

    container_hash="$(docker exec "$container_id" sha256sum "$container_file" | awk '{print $1}')"
    host_hash="$(sha256sum "$host_file" | awk '{print $1}')"
    [[ "$container_hash" == "$host_hash" ]] || {
      echo "Backup copy differs from SQL Server's file: $file" >&2
      exit 1
    }
  done

  (cd "$backup_dir" && sha256sum ./*.bak > SHA256SUMS)
  touch "$backup_dir/VERIFIED"
  echo "Verified database backups: $backup_dir"
  exit 0
fi

test -f "$backup_dir/VERIFIED"
for name in "${backup_names[@]}"; do
  test -s "$backup_dir/$name-$stamp.bak"
done
(cd "$backup_dir" && sha256sum -c SHA256SUMS)

# Copy and verify all files before changing any database.
for index in "${!databases[@]}"; do
  container_id="${containers[$index]}"
  file="${backup_names[$index]}-$stamp.bak"
  container_file="$container_dir/$file"
  docker exec "$container_id" mkdir -p "$container_dir"
  docker cp "$backup_dir/$file" "$container_id:$container_file"
  docker exec -u 0 "$container_id" chown mssql:mssql "$container_file"
  sql "$container_id" "RESTORE VERIFYONLY FROM DISK = N'$container_file' WITH CHECKSUM"
done

for index in "${!databases[@]}"; do
  database="${databases[$index]}"
  container_id="${containers[$index]}"
  container_file="$container_dir/${backup_names[$index]}-$stamp.bak"
  sql "$container_id" "ALTER DATABASE [$database] SET SINGLE_USER WITH ROLLBACK IMMEDIATE"
  if ! sql "$container_id" "RESTORE DATABASE [$database] FROM DISK = N'$container_file' WITH REPLACE, RECOVERY, CHECKSUM"; then
    sql "$container_id" "ALTER DATABASE [$database] SET MULTI_USER" || true
    echo "Restore failed for ${backup_names[$index]}. Keep the API closed." >&2
    exit 1
  fi
  sql "$container_id" "ALTER DATABASE [$database] SET MULTI_USER"
done

echo "Production and demo databases restored from $stamp."
