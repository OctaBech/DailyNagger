#!/usr/bin/env bash
set -euo pipefail

remote_path="${1:-/opt/dailynagger}"
cd "$remote_path"

test -f deploy/Caddyfile
mkdir -p caddy-state

# The active config is runtime state, not part of the source archive. Never
# overwrite it: a restart during publication must preserve maintenance mode.
if [[ ! -e caddy-state/Caddyfile ]]; then
  cp deploy/Caddyfile caddy-state/Caddyfile
fi

test -s caddy-state/Caddyfile
