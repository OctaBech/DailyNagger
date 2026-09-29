#!/usr/bin/env bash
set -euo pipefail

context="${1:?Usage: ./run-vps-ef-migration.sh <DbContextName> [source-dir]}"
source_dir="${2:-/opt/dailynagger}"

case "$context" in
  DailyNaggerDbContext|DailyNaggerControlDbContext) ;;
  *) echo "Unsupported migration context: $context" >&2; exit 2 ;;
esac

test -f "$source_dir/src/DailyNagger.Server/DailyNagger.Server.csproj"
cd "$source_dir"

docker run --rm \
  --network dailynagger_default \
  --env-file /opt/dailynagger/.env \
  -v "$source_dir:/src" \
  -w /src \
  mcr.microsoft.com/dotnet/sdk:10.0 \
  bash -lc "export ConnectionStrings__DailyNaggerControl=\"Server=sqlserver,1433;Database=DailyNaggerControl;User Id=sa;Password=\${MSSQL_SA_PASSWORD};Encrypt=True;TrustServerCertificate=True\"; export ConnectionStrings__DailyNaggerData=\"Server=sqlserver,1433;Database=DailyNaggerData;User Id=sa;Password=\${MSSQL_SA_PASSWORD};Encrypt=True;TrustServerCertificate=True\"; export DailyNaggerData__Password=\"\${DAILY_NAGGER_SQL_APP_PASSWORD}\"; dotnet restore src/DailyNagger.Server/DailyNagger.Server.csproj; dotnet tool install --global dotnet-ef --version 10.0.8; export PATH=\"\$PATH:/root/.dotnet/tools\"; dotnet ef database update --project src/DailyNagger.Server --startup-project src/DailyNagger.Server --context ${context}"
