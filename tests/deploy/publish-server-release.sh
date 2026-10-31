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
mkdir -p "$root/releases/123/deploy"
cat > "$root/releases/123/deploy/set-caddy-mode.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cp "$2/deploy/Caddyfile.maintenance" "$2/caddy-state/Caddyfile"
EOF
expect_failure rollback 123 "$root"
grep -q 'Refusing automatic database restore' "$root/output"
grep -qx 'DAILY_NAGGER_IMAGE_TAG=old-image' "$root/.env"

# Before traffic opens, restore the previous normal routing with the image.
rm "$root/releases/123/state/traffic-opening"
cp "$root/.env" "$root/releases/123/state/env.before-release"
printf 'previous generated routes\n' > "$root/releases/123/state/previous-Caddyfile"
printf 'candidate generated routes\n' > "$root/releases/123/state/candidate-Caddyfile"
cp "$repo_root/deploy/set-caddy-mode.sh" "$root/releases/123/deploy/"
cat > "$root/releases/123/deploy/smoke-internal-api.sh" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
cat > "$root/bin/docker" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
bash "$publisher" rollback 123 "$root"
cmp "$root/releases/123/state/previous-Caddyfile" "$root/caddy-state/normal.Caddyfile"
cmp "$root/releases/123/state/previous-Caddyfile" "$root/caddy-state/Caddyfile"
grep -qx 'DAILY_NAGGER_IMAGE_TAG=old-image' "$root/.env"

# A successful smoke allows activation of the matching candidate routing.
cp "$root/deploy/Caddyfile.maintenance" "$root/caddy-state/Caddyfile"
touch "$root/releases/123/state/candidate-smoke-passed"
printf 'DAILY_NAGGER_PUBLIC_HOST=localhost\n' >> "$root/.env"
cat > "$root/bin/curl" <<'EOF'
#!/usr/bin/env bash
printf 200
EOF
chmod +x "$root/bin/curl"
# Keep the shell test runnable in Git Bash as well as Linux CI.
cat > "$root/bin/cat" <<'EOF'
#!/usr/bin/env bash
if [[ "$*" == /proc/sys/kernel/random/uuid ]]; then
  printf '11111111-1111-4111-8111-111111111111\n'
else
  exec /usr/bin/cat "$@"
fi
EOF
chmod +x "$root/bin/cat"
bash "$publisher" open 123 "$root"
cmp "$root/releases/123/state/candidate-Caddyfile" "$root/caddy-state/normal.Caddyfile"
cmp "$root/releases/123/state/candidate-Caddyfile" "$root/caddy-state/Caddyfile"
test -f "$root/releases/123/state/traffic-opened"

echo "Server publish safety guards passed."
