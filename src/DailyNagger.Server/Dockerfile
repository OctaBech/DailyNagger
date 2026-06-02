FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY global.json ./
COPY Directory.Build.props ./
COPY src/DailyNagger.Server/DailyNagger.Server.csproj src/DailyNagger.Server/
RUN dotnet restore src/DailyNagger.Server/DailyNagger.Server.csproj

COPY src/DailyNagger.Server src/DailyNagger.Server
RUN dotnet publish src/DailyNagger.Server/DailyNagger.Server.csproj --configuration Release --output /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "DailyNagger.Server.dll"]
