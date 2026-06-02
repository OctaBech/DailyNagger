using DailyNagger.Server.Contracts;
using DailyNagger.Server.Operations;

namespace DailyNagger.Server.Api;

public static class TaskSeriesApi
{
    public static IEndpointRouteBuilder MapTaskSeriesApi(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/task-series", async (
            Guid communityId,
            DataDbRead dataDbRead,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var taskSeries = await dataDbRead.GetTaskSeriesAsync(
                    communityId,
                    cancellationToken);

                return Results.Ok(taskSeries
                    .Select(series => new TaskSeriesDto(series.Id))
                    .ToArray());
            }
            catch (NagCommunityNotFoundException exception)
            {
                return Results.NotFound(new
                {
                    error = exception.Message
                });
            }
            catch (Exception exception)
            {
                return Results.Problem(
                    environment.IsDevelopment() ? exception.ToString() : exception.Message);
            }
        }).WithTags("Task Series");

        return app;
    }
}
