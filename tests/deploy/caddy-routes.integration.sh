#!/usr/bin/env bash
set -euo pipefail

image="${1:-dailynagger-server:ci}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
work="$(mktemp -d)"
name="dn-caddy-test-$$"
cleanup() {
  docker rm -f "$name-proxy" "$name-server" >/dev/null 2>&1 || true
  docker network rm "$name" >/dev/null 2>&1 || true
  rm -rf -- "$work"
}
trap cleanup EXIT

bash "$repo_root/deploy/build-caddy-routes.sh" "$image" "$work/Caddyfile"
if grep -q '/openapi/' "$work/Caddyfile"; then
  echo 'Development-only routes leaked into the production allowlist.' >&2
  exit 1
fi
docker network create "$name" >/dev/null
docker run -d --name "$name-server" --network "$name" --network-alias server \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e DailyNagger__ApiToken=ci-routing-token \
  "$image" >/dev/null
docker run --rm --network none --entrypoint caddy \
  -e DAILY_NAGGER_PUBLIC_HOST=:8080 \
  -v "$work:/etc/caddy:ro" caddy:2.10-alpine \
  validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker run -d --name "$name-proxy" --network "$name" \
  -p 127.0.0.1::8080 -e DAILY_NAGGER_PUBLIC_HOST=:8080 \
  -v "$work:/etc/caddy:ro" caddy:2.10-alpine >/dev/null
address="http://$(docker port "$name-proxy" 8080/tcp)"
ready=false
for attempt in {1..30}; do
  if curl -fsS --max-time 2 -H "dn.api.request_id: $(cat /proc/sys/kernel/random/uuid)" \
    "$address/api/health" >/dev/null; then
    ready=true
    break
  fi
  sleep 1
done
[[ "$ready" == true ]] || { docker logs "$name-proxy"; docker logs "$name-server"; exit 1; }

check() {
  local method="$1" path="$2" expected="$3" forwarded="$4"
  local id actual logs
  id="$(cat /proc/sys/kernel/random/uuid)"
  actual="$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' \
    -X "$method" -H "dn.api.request_id: $id" "$address$path")"
  [[ "$actual" == "$expected" ]] || {
    echo "$method $path: expected $expected, got $actual" >&2; exit 1;
  }
  logs="$(docker logs "$name-server" 2>&1)"
  if [[ "$forwarded" == true ]]; then
    grep -q "$id" <<< "$logs" || { echo "Allowed request did not reach ASP.NET: $path" >&2; exit 1; }
  else
    if grep -q "$id" <<< "$logs"; then
      echo "Rejected request reached ASP.NET: $method $path" >&2; exit 1
    fi
  fi
}

# Authentication is intentionally absent: 401 proves forwarding without
# touching databases. Health is public and returns 200.
id=11111111-1111-4111-8111-111111111111
check GET /api/health 200 true
check GET /api/tags 401 true
check PUT /api/tags 401 true
check PUT "/api/nags/$id" 401 true
check PATCH "/api/task-logs/$id/task-entries" 401 true
check GET "/api/naggers/$id/task-step-name-suggestions" 401 true
check POST /api/demo/data 401 true
check DELETE /api/demo/data 401 true
for path in / /wordpress/wp-json/ /admin/settings /auth/login /api/sherlock-unknown /openapi/v1.json; do
  check GET "$path" 404 false
done
check DELETE /api/health 404 false
check POST /api/tags 404 false

# The agreed parameter replacement is deliberately coarse, not a second
# implementation of ASP.NET route constraints.
check PUT /api/nags/not-a-guid 401 true
echo 'Generated Caddy routing passed: allowed, parameterized, method mismatch, and scanner requests.'
