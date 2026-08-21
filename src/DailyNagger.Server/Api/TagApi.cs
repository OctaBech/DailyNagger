using DailyNagger.Server.Contracts;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Validation;

namespace DailyNagger.Server.Api;

public static class TagApi
{
    public static IEndpointRouteBuilder MapTagApi(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/tags", async (
            Guid communityId,
            Guid userId,
            string tagType,
            DataDbRead dataDbRead,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var tags = await dataDbRead.GetTagsAsync(
                    communityId,
                    userId,
                    tagType,
                    cancellationToken);

                return Results.Ok(tags);
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
        })
            .WithTags("Tags")
            .Produces<TagDto[]>(StatusCodes.Status200OK);

        app.MapPut("/api/tags", async (
            SaveTagRequest request,
            NagRequestValidator validator,
            DataDbWrite dataDbWrite,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                validator.Validate(request);

                var saved = await dataDbWrite.SaveTagAsync(
                    request.CommunityId,
                    request.UserId,
                    request.TagType,
                    request.Name,
                    request.Description,
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
        })
            .WithTags("Tags")
            .Produces<TagDto>(StatusCodes.Status200OK);

        return app;
    }
}
