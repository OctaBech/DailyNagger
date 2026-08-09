using DailyNagger.Server.Contracts;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Validation;

namespace DailyNagger.Server.Api;

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
            DataDbRead dataDbRead,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var moods = await dataDbRead.GetUserMoodsAsync(
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
            DataDbWrite dataDbWrite,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                validator.Validate(request);

                var saved = await dataDbWrite.SaveUserMoodAsync(
                    request.CommunityId,
                    request.UserId,
                    request.Payload.Id,
                    request.Payload.Mood,
                    request.Payload.RecordedAt,
                    request.Payload.TimeZone,
                    request.Payload.Locale,
                    request.ClientIdentity,
                    cancellationToken);

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
