#!/usr/bin/env bash
set -euo pipefail

mode="${1:?Usage: set-caddy-mode.sh <normal|maintenance> [remote-path]}"
remote_path="${2:-/opt/dailynagger}"

case "$mode" in
  normal) template="deploy/Caddyfile" ;;
  maintenance) template="deploy/Caddyfile.maintenance" ;;
  *) echo "Unsupported Caddy mode: $mode" >&2; exit 2 ;;
esac

cd "$remote_path"
test -s "$template"
test -s caddy-state/Caddyfile

compose=(docker compose -f compose.prod.yaml)
container_template="/etc/caddy-templates/${template#deploy/}"

# Validate the candidate before changing the persistent active config.
"${compose[@]}" exec -T reverse-proxy caddy validate \
  --config "$container_template" --adapter caddyfile

previous="$(mktemp caddy-state/Caddyfile.previous.XXXXXX)"
candidate="$(mktemp caddy-state/Caddyfile.candidate.XXXXXX)"
trap 'rm -f "$previous" "$candidate"' EXIT
cp caddy-state/Caddyfile "$previous"
cp "$template" "$candidate"
chmod 644 "$candidate"
mv -f "$candidate" caddy-state/Caddyfile

if ! "${compose[@]}" exec -T reverse-proxy caddy reload \
  --config /etc/caddy/Caddyfile --adapter caddyfile; then
  # A failed reload leaves the running Caddy config unchanged. Restore the
  # on-disk config too, so a Caddy restart cannot load the failed candidate.
  mv -f "$previous" caddy-state/Caddyfile
  "${compose[@]}" exec -T reverse-proxy caddy reload \
    --config /etc/caddy/Caddyfile --adapter caddyfile || true
  echo "Caddy mode switch failed; restored the previous config on disk." >&2
  exit 1
fi

echo "Caddy mode: $mode"
