# Production Deploy Runbook

This runbook is the operator guide for DailyNagger production deploys, backups, smoke checks, and rollback.

## GitHub Setup

Production workflows use the GitHub environment named `production`.

Required environment secrets:

- `DAILY_NAGGER_DEPLOY_HOST`: VPS host or IP.
- `DAILY_NAGGER_DEPLOY_SSH_PRIVATE_KEY`: private SSH key used by GitHub Actions.
- `DAILY_NAGGER_DEPLOY_KNOWN_HOSTS`: known SSH host keys for the VPS.

## Workflow Buttons

- `Production Smoke`: read-only production health check.
- `Production Backup`: backs up both production databases and uploads a GitHub artifact.
- `Production Deploy`: backs up both production databases, deploys the server, and smoke-tests production.

Database backup artifacts expire after 14 days. They are deploy safety artifacts, not long-term backup storage.

## Deploy Chain

1. `deploy-production.ps1` backs up both production databases first.
2. `deploy-server.ps1` packages server source, uploads it to `/opt/dailynagger`, and builds a tagged Docker image on the VPS.
3. EF migrations run unless `-SkipMigrations` is set.
4. `server` and `reverse-proxy` containers restart.
5. Production smoke checks verify health, database health, and today's plan.

Deploy stops if backup fails.

## Manual Rollback

1. Identify the previous stable image tag from VPS `.env.backup-server-*` files or `docker image ls dailynagger-server`.
2. On the VPS, edit `/opt/dailynagger/.env` and set `DAILY_NAGGER_IMAGE_TAG` to that stable tag.
3. From `/opt/dailynagger`, run `docker compose -f compose.prod.yaml up -d server reverse-proxy`.
4. Run `docker compose -f compose.prod.yaml ps`.
5. Run `docker compose -f compose.prod.yaml logs --tail=80 server`.
6. Run `Production Smoke` before declaring rollback complete.

## Database Restore Rule

Database backups are for catastrophic recovery.

Do not restore a database backup for ordinary code bugs. Prefer backward-compatible migrations. Restore a database only when a harmful migration corrupted data and newer production data can be discarded.
