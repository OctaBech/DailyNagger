#!/usr/bin/env bash
set -euo pipefail

# One-time transition from the old Caddyfile bind mount to persistent routing
# state. Does not stop the API or SQL Server and never edits either database.
stage_dir="${1:?Expected a staged release directory}"
deploy_dir="${2:-/opt/dailynagger}"
cd "$deploy_dir"

for path in \
  compose.prod.yaml \
  deploy/Caddyfile \
  deploy/Caddyfile.maintenance \
  deploy/prepare-caddy-state.sh \
  deploy/set-caddy-mode.sh \
  deploy/check-production-publish-prerequisites.sh \
  deploy/production-db-backup-restore.sh; do
  test -s "$stage_dir/$path" || { echo "Missing staged file: $path" >&2; exit 1; }
done

# The bootstrap is only a mount change, not an opportunity to alter routing.
cmp -s deploy/Caddyfile "$stage_dir/deploy/Caddyfile" || {
  echo "Normal Caddy routing differs from the live version; refusing bootstrap." >&2
  exit 1
}

if [[ -e caddy-state/Caddyfile ]]; then
  cmp -s caddy-state/Caddyfile deploy/Caddyfile || {
    echo "Active Caddy state is not normal; inspect before bootstrap." >&2
    exit 1
  }
fi

previous_compose="$(mktemp "$deploy_dir/compose.prod.yaml.before-caddy.XXXXXX")"
cp -p compose.prod.yaml "$previous_compose"
completed=false

restore_previous_proxy_on_failure() {
  status=$?
  if [[ "$completed" != true ]]; then
    echo "Caddy bootstrap failed; restoring the previous proxy configuration." >&2
    cp -p "$previous_compose" compose.prod.yaml
    if docker compose -f compose.prod.yaml up -d --no-deps reverse-proxy; then
      # The old proxy reads deploy/Caddyfile. Reset the unused persistent state
      # so the next bootstrap attempt does not inherit a stale maintenance flag.
      cp deploy/Caddyfile caddy-state/Caddyfile
    else
      echo "Automatic proxy recovery failed. Inspect the VPS immediately." >&2
    fi
  fi
  exit "$status"
}
trap restore_previous_proxy_on_failure EXIT

install -m 644 "$stage_dir/compose.prod.yaml" compose.prod.yaml
install -m 644 "$stage_dir/deploy/Caddyfile.maintenance" deploy/Caddyfile.maintenance
install -m 755 "$stage_dir/deploy/prepare-caddy-state.sh" deploy/prepare-caddy-state.sh
install -m 755 "$stage_dir/deploy/set-caddy-mode.sh" deploy/set-caddy-mode.sh
install -m 755 "$stage_dir/deploy/check-production-publish-prerequisites.sh" deploy/check-production-publish-prerequisites.sh
install -m 755 "$stage_dir/deploy/production-db-backup-restore.sh" deploy/production-db-backup-restore.sh

bash deploy/prepare-caddy-state.sh "$deploy_dir"
cmp -s caddy-state/Caddyfile deploy/Caddyfile
docker compose -f compose.prod.yaml config --quiet

# Validate both mounted templates before replacing the live proxy container.
for template in Caddyfile Caddyfile.maintenance; do
  docker compose -f compose.prod.yaml run --rm --no-deps \
    --entrypoint caddy reverse-proxy validate \
    --config "/etc/caddy-templates/$template" --adapter caddyfile
done

docker compose -f compose.prod.yaml up -d --no-deps reverse-proxy
bash deploy/check-production-publish-prerequisites.sh "$deploy_dir"

public_host="$(sed -n 's/^DAILY_NAGGER_PUBLIC_HOST=//p' .env | head -n 1)"
test -n "$public_host"
health_url="https://$public_host/api/health"
# Send both header names so checks also work after rollback to the previous server.
request_id="$(cat /proc/sys/kernel/random/uuid)"

wait_for_http_status() {
  expected="$1"
  for attempt in {1..20}; do
    actual="$(curl --max-time 5 -sS -o /dev/null -w '%{http_code}' \
      -H "dn.api.request_id: $request_id" -H "X-DailyNagger-Request-Id: $request_id" "$health_url")" || actual="unavailable"
    if [[ "$actual" == "$expected" ]]; then
      return 0
    fi
    sleep 1
  done
  echo "Expected HTTP $expected after Caddy transition; last result: $actual" >&2
  return 1
}

bash deploy/set-caddy-mode.sh maintenance "$deploy_dir"
wait_for_http_status 503

# A Caddy restart must not silently reopen the API during publication.
docker compose -f compose.prod.yaml restart reverse-proxy
wait_for_http_status 503

bash deploy/set-caddy-mode.sh normal "$deploy_dir"
wait_for_http_status 200
bash deploy/check-production-publish-prerequisites.sh "$deploy_dir"

completed=true
echo "Persistent Caddy maintenance and normal routing both passed."
echo "Previous Compose file retained at: $previous_compose"
