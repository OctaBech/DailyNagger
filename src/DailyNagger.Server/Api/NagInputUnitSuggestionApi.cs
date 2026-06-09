using DailyNagger.Server.Operations;

namespace DailyNagger.Server.Api;

public static class NagInputUnitSuggestionApi
{
    public static IEndpointRouteBuilder MapNagInputUnitSuggestionApi(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/nag-input-unit-suggestions", async (
            Guid communityId,
            Guid userId,
            DataDbRead dataDbRead,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var units = await dataDbRead.GetNagInputUnitSuggestionsAsync(
                    communityId,
                    userId,
                    cancellationToken);

                return Results.Ok(units);
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
        }).WithTags("NagInputUnitSuggestions");

        return app;
    }
}
