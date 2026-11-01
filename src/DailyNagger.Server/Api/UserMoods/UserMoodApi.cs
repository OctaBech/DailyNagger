using DailyNagger.Server.Contracts.UserMoods;
using DailyNagger.Server.Database.Connections;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Validation;

namespace DailyNagger.Server.Api.UserMoods;

public static class UserMoodApi
{
    public static IEndpointRouteBuilder MapUserMoodApi(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/user-moods", async (
            Guid communityId,
            Guid userId,
            DateTimeOffset? from,
            DateTimeOffset? to,
            int? take,
            OperationsFacade operations,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var moods = await operations.UserMoods.GetAsync(
                    communityId,
                    userId,
                    from,
                    to,
                    Math.Clamp(take ?? 100, 1, 1000),
                    cancellationToken);

                return Results.Ok(moods);
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
        }).WithTags("UserMoods");

        app.MapPost("/api/user-moods", async (
            SaveUserMoodRequest request,
            NagRequestValidator validator,
            OperationsFacade operations,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                validator.Validate(request);

                var saved = await operations.UserMoods.SaveAsync(request, cancellationToken);

                return Results.Ok(saved);
            }
            catch (NagValidationException exception)
            {
                return Results.BadRequest(new
                {
                    error = exception.Message
                });
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
        }).WithTags("UserMoods");

        return app;
    }
}
