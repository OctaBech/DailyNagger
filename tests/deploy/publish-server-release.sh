#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
publisher="$repo_root/deploy/publish-server-release.sh"
root="$(mktemp -d)"
trap 'rm -rf -- "$root"' EXIT

mkdir -p "$root/deploy" "$root/caddy-state" "$root/releases/123/state" "$root/bin"
printf 'normal\n' > "$root/deploy/Caddyfile"
printf 'maintenance\n' > "$root/deploy/Caddyfile.maintenance"
cp "$root/deploy/Caddyfile" "$root/caddy-state/Caddyfile"
printf 'old-image\n' > "$root/releases/123/state/previous-image-tag"
printf 'DAILY_NAGGER_IMAGE_TAG=old-image\n' > "$root/.env"

cat > "$root/bin/docker" <<'EOF'
#!/usr/bin/env bash
if [[ "$*" == *'ps -q server'* ]]; then
  exit 0
fi
echo "Unexpected Docker operation: $*" >&2
exit 1
EOF
chmod +x "$root/bin/docker"
export PATH="$root/bin:$PATH"

expect_failure() {
  if bash "$publisher" "$@" > "$root/output" 2>&1; then
    echo "Unexpectedly accepted phase: $1" >&2
    exit 1
  fi
}

# No backup can begin before Caddy is in maintenance mode.
expect_failure backup 123 "$root"
test ! -e "$root/releases/123/state/backup-stamp"

cp "$root/deploy/Caddyfile.maintenance" "$root/caddy-state/Caddyfile"

# A migration needs a verified, complete backup even with the API stopped.
expect_failure migrate 123 "$root"
test ! -e "$root/releases/123/state/migration-started"

# Public traffic cannot reopen without a successful candidate smoke check.
expect_failure open 123 "$root"
cmp -s "$root/caddy-state/Caddyfile" "$root/deploy/Caddyfile.maintenance"

# Once opening has begun, rollback must never restore a possibly live DB.
touch "$root/releases/123/state/traffic-opening"
cat > "$root/deploy/set-caddy-mode.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cp "$2/deploy/Caddyfile.maintenance" "$2/caddy-state/Caddyfile"
EOF
expect_failure rollback 123 "$root"
grep -q 'Refusing automatic database restore' "$root/output"
grep -qx 'DAILY_NAGGER_IMAGE_TAG=old-image' "$root/.env"

echo "Server publish safety guards passed."
