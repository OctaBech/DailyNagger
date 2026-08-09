using DailyNagger.Server.Operations;

namespace DailyNagger.Server.Api;

public static class TaskStepSuggestionApi
{
    public static IEndpointRouteBuilder MapTaskStepSuggestionApi(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/naggers/{naggerId:guid}/task-step-name-suggestions", async (
            Guid communityId,
            Guid userId,
            Guid naggerId,
            DataDbRead dataDbRead,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var suggestions = await dataDbRead.GetTaskStepNameSuggestionsAsync(
                    communityId,
                    userId,
                    naggerId,
                    cancellationToken);

                return Results.Ok(suggestions);
            }
            catch (Exception exception)
            {
                return Results.Problem(
                    environment.IsDevelopment() ? exception.ToString() : exception.Message);
            }
        }).WithTags("TaskStepSuggestions");

        return app;
    }
}
