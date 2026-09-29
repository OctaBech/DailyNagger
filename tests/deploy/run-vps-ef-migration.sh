#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
root="$(mktemp -d)"
trap 'rm -rf "$root"' EXIT
mkdir -p "$root/bin" "$root/src/DailyNagger.Server"
touch "$root/src/DailyNagger.Server/DailyNagger.Server.csproj"
export MOCK_LOG="$root/docker.log"

cat > "$root/bin/docker" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$MOCK_LOG"
MOCK
chmod +x "$root/bin/docker"
export PATH="$root/bin:$PATH"

script="$repo_root/deploy/run-vps-ef-migration.sh"
bash "$script" DailyNaggerDbContext "$root" production
grep -q 'Server=sqlserver,1433;Database=DailyNaggerData' "$MOCK_LOG"

bash "$script" DailyNaggerDbContext "$root" demo
grep -q 'Server=dailynagger-staging-sqlserver,1433;Database=DailyNaggerData' "$MOCK_LOG"

if bash "$script" DailyNaggerControlDbContext "$root" demo; then
  echo "Control DB migration was accepted on demo SQL Server." >&2
  exit 1
fi
test "$(wc -l < "$MOCK_LOG")" -eq 2

echo "Production and demo migration targets passed."
