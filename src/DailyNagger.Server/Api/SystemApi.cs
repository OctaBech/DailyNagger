using DailyNagger.Server.Operations;

namespace DailyNagger.Server.Api;

public static class SystemApi
{
    public static IEndpointRouteBuilder MapSystemApi(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/health", () => Results.Ok(new { status = "ok" })).WithTags("System");

        app.MapGet("/api/health/database", async (
            OperationsFacade operations,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                await operations.System.CheckDatabaseAsync(cancellationToken);

                return Results.Ok(new { database = "ok" });
            }
            catch (Exception exception)
            {
                return ApiErrorResults.Problem(exception, environment);
            }
        }).WithTags("System");

        return app;
    }
}
