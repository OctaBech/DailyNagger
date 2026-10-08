#!/usr/bin/env bash
set -euo pipefail
umask 077

phase="${1:?Expected a publish phase}"
run_id="${2:?Expected the CD run ID}"
deploy_dir="${3:-/opt/dailynagger}"
shift 3

[[ "$run_id" =~ ^[0-9]+$ ]] || { echo "Invalid CD run ID." >&2; exit 2; }
cd "$deploy_dir"
release_dir="$deploy_dir/releases/$run_id"
state_dir="$release_dir/state"
compose=(docker compose -f compose.prod.yaml)

require_state() {
  test -s "$state_dir/previous-image-tag" || {
    echo "Release $run_id was not prepared." >&2
    exit 1
  }
}

require_maintenance() {
  cmp -s caddy-state/Caddyfile deploy/Caddyfile.maintenance || {
    echo "Caddy is not in maintenance mode; refusing $phase." >&2
    exit 1
  }
}

require_api_stopped() {
  container="$("${compose[@]}" ps -q server)"
  if [[ -n "$container" && "$(docker inspect -f '{{.State.Running}}' "$container")" == true ]]; then
    echo "API is still running; refusing $phase." >&2
    exit 1
  fi
}

wait_for_public_status() {
  expected="$1"
  public_host="$(sed -n 's/^DAILY_NAGGER_PUBLIC_HOST=//p' .env | head -n 1)"
  test -n "$public_host"
  # Send both header names so checks also work after rollback to the previous server.
  request_id="$(cat /proc/sys/kernel/random/uuid)"
  for attempt in {1..20}; do
    actual="$(curl --max-time 5 -s -o /dev/null -w '%{http_code}' \
      -H "dn.api.request_id: $request_id" -H "X-DailyNagger-Request-Id: $request_id" \
      "https://$public_host/api/health")" || actual="unavailable"
    if [[ "$actual" == "$expected" ]]; then
      return 0
    fi
    sleep 1
  done
  echo "Expected public HTTP $expected; last result: $actual" >&2
  return 1
}

case "$phase" in
  prepare)
    sha="${1:?Expected candidate commit SHA}"
    digest="${2:?Expected server image digest}"
    [[ "$sha" =~ ^[0-9a-f]{40}$ && "$digest" =~ ^sha256:[0-9a-f]{64}$ ]] || {
      echo "Invalid candidate identity." >&2; exit 2;
    }
    test -f "$release_dir/src/DailyNagger.Server/DailyNagger.Server.csproj"
    test -s "$release_dir/deploy/run-vps-ef-migration.sh"
    # Compose and proxy changes need a separately reviewed bootstrap; a server
    # image publish must not silently change the infrastructure beneath it.
    for file in compose.prod.yaml deploy/Caddyfile deploy/Caddyfile.maintenance; do
      cmp -s "$release_dir/$file" "$deploy_dir/$file" || {
        echo "Infrastructure differs: $file. Prepare the VPS before publishing." >&2
        exit 1
      }
    done
    bash "$release_dir/deploy/check-production-publish-prerequisites.sh" "$deploy_dir"
    old_tag="$(sed -n 's/^DAILY_NAGGER_IMAGE_TAG=//p' .env | head -n 1)"
    [[ "$old_tag" =~ ^[A-Za-z0-9_.-]+$ ]] || { echo "Invalid previous image tag." >&2; exit 1; }
    docker image inspect "dailynagger-server:$old_tag" > /dev/null
    docker image inspect "dailynagger-server:$sha" > /dev/null
    mkdir -m 700 -p "$state_dir"
    test ! -e "$state_dir/previous-image-tag" || { echo "Release was already prepared." >&2; exit 1; }
    cp -p .env "$state_dir/env.before-release"
    printf '%s\n' "$old_tag" > "$state_dir/previous-image-tag"
    printf '%s\n' "$sha" > "$state_dir/candidate-image-tag"
    printf '%s\n' "$digest" > "$state_dir/candidate-image-digest"
    echo "Candidate source, image, and previous image verified."
    ;;

  maintenance)
    require_state
    bash deploy/set-caddy-mode.sh maintenance "$deploy_dir"
    require_maintenance
    wait_for_public_status 503
    touch "$state_dir/maintenance-active"
    ;;

  stop)
    require_state
    require_maintenance
    "${compose[@]}" stop server
    require_api_stopped
    touch "$state_dir/api-stopped"
    ;;

  backup)
    require_state
    require_maintenance
    require_api_stopped
    stamp="$(date -u +%Y%m%d-%H%M%S)"
    printf '%s\n' "$stamp" > "$state_dir/backup-stamp"
    bash "$release_dir/deploy/production-db-backup-restore.sh" backup "$stamp" "$deploy_dir"
    test -f "$deploy_dir/backups/$stamp/VERIFIED"
    touch "$state_dir/backup-verified"
    ;;

  migrate)
    require_state
    require_maintenance
    require_api_stopped
    test -f "$state_dir/backup-verified"
    touch "$state_dir/migration-started"
    bash "$release_dir/deploy/run-vps-ef-migration.sh" DailyNaggerDbContext "$release_dir" production
    bash "$release_dir/deploy/run-vps-ef-migration.sh" DailyNaggerDbContext "$release_dir" demo
    bash "$release_dir/deploy/run-vps-ef-migration.sh" DailyNaggerControlDbContext "$release_dir"
    ;;

  start)
    require_state
    require_maintenance
    require_api_stopped
    test -f "$state_dir/backup-verified"
    sha="$(cat "$state_dir/candidate-image-tag")"
    [[ "$sha" =~ ^[0-9a-f]{40}$ ]]
    sed -i "s/^DAILY_NAGGER_IMAGE_TAG=.*/DAILY_NAGGER_IMAGE_TAG=$sha/" .env
    grep -qx "DAILY_NAGGER_IMAGE_TAG=$sha" .env
    "${compose[@]}" up -d --no-deps server
    touch "$state_dir/candidate-started"
    ;;

  smoke)
    require_state
    require_maintenance
    test -f "$state_dir/candidate-started"
    bash "$release_dir/deploy/smoke-internal-api.sh" "$@" "$deploy_dir"
    touch "$state_dir/candidate-smoke-passed"
    ;;

  open)
    require_state
    require_maintenance
    test -f "$state_dir/candidate-smoke-passed"
    # From this point onward, a client may write to the new databases.
    # A failed public check must NOT trigger automatic database restoration.
    touch "$state_dir/traffic-opening"
    bash deploy/set-caddy-mode.sh normal "$deploy_dir"
    wait_for_public_status 200
    touch "$state_dir/traffic-opened"
    echo "Server publication complete; public traffic reopened."
    ;;

  rollback)
    if [[ -f "$state_dir/traffic-opening" ]]; then
      bash deploy/set-caddy-mode.sh maintenance "$deploy_dir" || true
      echo "Traffic may already have reopened. Refusing automatic database restore." >&2
      exit 1
    fi
    if ! cmp -s caddy-state/Caddyfile deploy/Caddyfile.maintenance; then
      echo "No active maintenance window; there is no server state to roll back."
      exit 0
    fi
    require_state
    if [[ -f "$state_dir/migration-started" ]]; then
      "${compose[@]}" stop server
      require_api_stopped
      test -f "$state_dir/backup-verified"
      stamp="$(cat "$state_dir/backup-stamp")"
      bash "$release_dir/deploy/production-db-backup-restore.sh" restore "$stamp" "$deploy_dir"
    fi
    old_tag="$(cat "$state_dir/previous-image-tag")"
    [[ "$old_tag" =~ ^[A-Za-z0-9_.-]+$ ]]
    cp -p "$state_dir/env.before-release" .env
    grep -qx "DAILY_NAGGER_IMAGE_TAG=$old_tag" .env
    "${compose[@]}" up -d --no-deps server
    bash "$release_dir/deploy/smoke-internal-api.sh" "$@" "$deploy_dir"
    bash deploy/set-caddy-mode.sh normal "$deploy_dir"
    touch "$state_dir/rolled-back"
    echo "Previous image and database state restored; public traffic reopened."
    ;;

  *) echo "Unsupported publish phase: $phase" >&2; exit 2 ;;
esac
