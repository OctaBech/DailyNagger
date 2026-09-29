#!/usr/bin/env bash
set -euo pipefail

cd /opt/dailynagger

cat seed-production-minimum.sql | docker compose -f compose.prod.yaml exec -T sqlserver \
  /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "$(grep '^MSSQL_SA_PASSWORD=' .env | cut -d= -f2-)" \
  -C \
  -b
