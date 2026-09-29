#!/usr/bin/env bash
set -euo pipefail

deploy_dir="${1:-/opt/dailynagger}"
cd "$deploy_dir"

for path in \
  .env \
  compose.prod.yaml \
  deploy/Caddyfile \
  deploy/Caddyfile.maintenance \
  deploy/set-caddy-mode.sh \
  deploy/production-db-backup-restore.sh \
  caddy-state/Caddyfile; do
  test -s "$path" || {
    echo "Production publish prerequisite is missing: $path" >&2
    exit 1
  }
done

# Do not automatically resume a release left in maintenance by an earlier failure.
cmp -s caddy-state/Caddyfile deploy/Caddyfile || {
  echo "Caddy is not in normal mode; inspect the VPS before publishing." >&2
  exit 1
}

compose=(docker compose -f compose.prod.yaml)
"${compose[@]}" config --quiet

for service in sqlserver server reverse-proxy; do
  container="$("${compose[@]}" ps -q "$service")"
  test -n "$container" && test "$(docker inspect -f '{{.State.Running}}' "$container")" = true || {
    echo "Production service is not running: $service" >&2
    exit 1
  }
done

demo_container=dailynagger-staging-sqlserver
test "$(docker inspect -f '{{.State.Running}}' "$demo_container")" = true || {
  echo "Demo SQL Server is not running: $demo_container" >&2
  exit 1
}

proxy="$("${compose[@]}" ps -q reverse-proxy)"
active_mount="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/caddy"}}{{.Source}}:{{.RW}}{{end}}{{end}}' "$proxy")"
test "$active_mount" = "$deploy_dir/caddy-state:false" || {
  echo "Caddy is not using the persistent, read-only active configuration." >&2
  exit 1
}

"${compose[@]}" exec -T reverse-proxy caddy validate \
  --config /etc/caddy/Caddyfile --adapter caddyfile
echo "Production publish prerequisites passed."
