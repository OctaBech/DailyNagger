FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY global.json ./
COPY Directory.Build.props ./
COPY src/DailyNagger.Api/DailyNagger.Api.csproj src/DailyNagger.Api/
RUN dotnet restore src/DailyNagger.Api/DailyNagger.Api.csproj

COPY src/DailyNagger.Api src/DailyNagger.Api
RUN dotnet publish src/DailyNagger.Api/DailyNagger.Api.csproj --configuration Release --output /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "DailyNagger.Api.dll"]
