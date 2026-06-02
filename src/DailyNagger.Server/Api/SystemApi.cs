using DailyNagger.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Api;

public static class SystemApi
{
    public static IEndpointRouteBuilder MapSystemApi(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/health", () => Results.Ok(new { status = "ok" })).WithTags("System");

        app.MapGet("/api/health/database", async (
            DailyNaggerDbContext db,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                await using var connection = db.Database.GetDbConnection();
                await connection.OpenAsync(cancellationToken);

                return Results.Ok(new { database = "ok" });
            }
            catch (Exception exception)
            {
                return Results.Problem(
                    environment.IsDevelopment() ? exception.ToString() : exception.Message);
            }
        }).WithTags("System");

        return app;
    }
}
