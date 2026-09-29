#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
test_root="$(mktemp -d)"
trap 'rm -rf "$test_root"' EXIT
mkdir -p "$test_root/deploy" "$test_root/caddy-state" "$test_root/bin"
touch "$test_root/compose.prod.yaml" "$test_root/.env"
cp "$repo_root/deploy/Caddyfile" "$test_root/deploy/"
cp "$repo_root/deploy/Caddyfile.maintenance" "$test_root/deploy/"

cat > "$test_root/bin/docker" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$MOCK_LOG"

if [[ "$*" == *" ps -q server" ]]; then
  echo server-container
elif [[ "$*" == *" ps -q sqlserver" ]]; then
  echo sql-container
elif [[ "$1" == inspect ]]; then
  if [[ "$*" == *server-container* ]]; then
    echo "${FAKE_API_RUNNING:-false}"
  else
    echo true
  fi
elif [[ "$1" == cp && "$2" == *:* ]]; then
  printf 'test backup content\n' > "$3"
elif [[ "$*" == *" sha256sum "* && "$1" == exec ]]; then
  printf 'test backup content\n' | sha256sum | awk '{print $1}'
elif [[ "$*" == *"BACKUP DATABASE [${FAKE_BACKUP_FAILURE:-none}]"* ]]; then
  exit 1
elif [[ "${FAKE_BACKUP_FAILURE:-}" == DemoDailyNaggerData && "$*" == *dailynagger-staging-sqlserver*"BACKUP DATABASE [DailyNaggerData]"* ]]; then
  exit 1
fi
MOCK
chmod +x "$test_root/bin/docker"
export PATH="$test_root/bin:$PATH"
export MOCK_LOG="$test_root/docker.log"
script="$repo_root/deploy/production-db-backup-restore.sh"
stamp=20260929-120000

# Neither backup nor restore may run while public routing or the API is active.
if bash "$script" backup "$stamp" "$test_root"; then
  echo "Backup accepted normal Caddy routing." >&2
  exit 1
fi
cp "$test_root/deploy/Caddyfile.maintenance" "$test_root/caddy-state/Caddyfile"
if FAKE_API_RUNNING=true bash "$script" backup "$stamp" "$test_root"; then
  echo "Backup accepted a running API." >&2
  exit 1
fi

bash "$script" backup "$stamp" "$test_root"
test -f "$test_root/backups/$stamp/VERIFIED"
test -s "$test_root/backups/$stamp/DailyNaggerData-$stamp.bak"
test -s "$test_root/backups/$stamp/DailyNaggerControl-$stamp.bak"
test -s "$test_root/backups/$stamp/DemoDailyNaggerData-$stamp.bak"
bash "$script" restore "$stamp" "$test_root"

test "$(grep -c 'BACKUP DATABASE' "$MOCK_LOG")" -eq 3
test "$(grep -c 'RESTORE DATABASE' "$MOCK_LOG")" -eq 3
grep -q 'dailynagger-staging-sqlserver.*BACKUP DATABASE \[DailyNaggerData\]' "$MOCK_LOG"
grep -q 'dailynagger-staging-sqlserver.*RESTORE DATABASE \[DailyNaggerData\]' "$MOCK_LOG"

failed_stamp=20260929-120001
if FAKE_BACKUP_FAILURE=DailyNaggerControl bash "$script" backup "$failed_stamp" "$test_root"; then
  echo "A failed backup unexpectedly succeeded." >&2
  exit 1
fi
test ! -e "$test_root/backups/$failed_stamp/VERIFIED"

failed_demo_stamp=20260929-120002
if FAKE_BACKUP_FAILURE=DemoDailyNaggerData bash "$script" backup "$failed_demo_stamp" "$test_root"; then
  echo "A failed demo backup unexpectedly succeeded." >&2
  exit 1
fi
test ! -e "$test_root/backups/$failed_demo_stamp/VERIFIED"

printf 'tampered\n' >> "$test_root/backups/$stamp/DailyNaggerControl-$stamp.bak"
if bash "$script" restore "$stamp" "$test_root"; then
  echo "Restore accepted a changed backup file." >&2
  exit 1
fi
test "$(grep -c 'RESTORE DATABASE' "$MOCK_LOG")" -eq 3

echo "Database backup and restore guard tests passed."
