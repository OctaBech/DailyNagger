#!/usr/bin/env bash
set -euo pipefail

# Read-only checks while Caddy is returning 503 to the public.
production_community="${1:?Expected production community ID}"
demo_community="${2:?Expected demo community ID}"
user_id="${3:?Expected user ID}"
deploy_dir="${4:-/opt/dailynagger}"

for id in "$production_community" "$demo_community" "$user_id"; do
  [[ "$id" =~ ^[0-9a-fA-F-]{36}$ ]] || { echo "Invalid smoke-test ID." >&2; exit 2; }
done

cd "$deploy_dir"
test -f .env
cmp -s caddy-state/Caddyfile deploy/Caddyfile.maintenance || {
  echo "Refusing internal smoke test outside maintenance mode." >&2
  exit 1
}

server="$(docker compose -f compose.prod.yaml ps -q server)"
test -n "$server"
server_ip="$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$server")"
test -n "$server_ip"
base_url="http://$server_ip:8080"
# Send both header names so checks also work after rollback to the previous server.
request_id="$(cat /proc/sys/kernel/random/uuid)"
api_token="$(sed -n 's/^DAILY_NAGGER_API_TOKEN=//p' .env | head -n 1)"
test -n "$api_token"

for attempt in {1..30}; do
  if curl --max-time 5 -fsS -H "dn.api.request_id: $request_id" -H "X-DailyNagger-Request-Id: $request_id" \
    "$base_url/api/health" > /dev/null; then
    break
  fi
  if [[ "$attempt" == 30 ]]; then
    echo "Candidate API did not become healthy." >&2
    exit 1
  fi
  sleep 1
done

curl --max-time 10 -fsS -H "dn.api.request_id: $request_id" -H "X-DailyNagger-Request-Id: $request_id" \
  "$base_url/api/health/database" > /dev/null

for community_id in "$production_community" "$demo_community"; do
  curl --max-time 15 -fsS \
    -H "dn.api.request_id: $request_id" -H "X-DailyNagger-Request-Id: $request_id" \
    --oauth2-bearer "$api_token" \
    -G "$base_url/api/todays-nag-plan" \
    --data-urlencode "communityId=$community_id" \
    --data-urlencode "userId=$user_id" \
    --data-urlencode "date=$(date +%F)" > /dev/null
done

echo "Internal API, database, production community, and demo community passed."
