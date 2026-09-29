#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
test_root="$(mktemp -d)"
trap 'rm -rf "$test_root"' EXIT

mkdir -p "$test_root/deploy" "$test_root/bin"
cp "$repo_root/deploy/Caddyfile" \
  "$repo_root/deploy/Caddyfile.maintenance" "$test_root/deploy/"

# The switch test does not need a running Docker daemon. The real Caddy
# configurations are validated separately with the Caddy image in CI.
cat > "$test_root/bin/docker" <<'MOCK'
#!/usr/bin/env bash
if [[ "${FAIL_RELOAD:-0}" == 1 && " $* " == *" caddy reload "* ]]; then
  exit 1
fi
MOCK
chmod +x "$test_root/bin/docker"
export PATH="$test_root/bin:$PATH"

bash "$repo_root/deploy/prepare-caddy-state.sh" "$test_root"
cmp "$test_root/deploy/Caddyfile" "$test_root/caddy-state/Caddyfile"

bash "$repo_root/deploy/set-caddy-mode.sh" maintenance "$test_root"
cmp "$test_root/deploy/Caddyfile.maintenance" "$test_root/caddy-state/Caddyfile"

# Preparing the state again must never replace an active maintenance mode.
bash "$repo_root/deploy/prepare-caddy-state.sh" "$test_root"
cmp "$test_root/deploy/Caddyfile.maintenance" "$test_root/caddy-state/Caddyfile"

bash "$repo_root/deploy/set-caddy-mode.sh" normal "$test_root"
cmp "$test_root/deploy/Caddyfile" "$test_root/caddy-state/Caddyfile"

if FAIL_RELOAD=1 bash "$repo_root/deploy/set-caddy-mode.sh" maintenance "$test_root"; then
  echo "A failed Caddy reload unexpectedly succeeded." >&2
  exit 1
fi
cmp "$test_root/deploy/Caddyfile" "$test_root/caddy-state/Caddyfile"

echo "Caddy mode state tests passed."
