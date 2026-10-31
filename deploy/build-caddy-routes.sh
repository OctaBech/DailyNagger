#!/usr/bin/env bash
set -euo pipefail

# Run the exact release image as an offline exporter, not as a web server.
image="${1:?Expected server image}"
output="${2:?Expected output Caddyfile}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf -- "$work"' EXIT

docker run --rm --network none \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -v "$work:/export" \
  "$image" --generate-caddy-routes=/export/routes.caddy
test -s "$work/routes.caddy"

# Keep the import and its generated snippet in ONE self-contained file. This
# makes activation and rollback atomic, without a second mutable import file.
{
  printf '(api_routes) {\n'
  cat "$work/routes.caddy"
  printf '\n}\n'
  cat "$script_dir/Caddyfile.routes"
} > "$work/Caddyfile"
install -m 644 "$work/Caddyfile" "$output"
