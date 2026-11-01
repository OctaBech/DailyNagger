using DailyNagger.Server.Contracts.Tags;
using DailyNagger.Server.Database.Connections;
using DailyNagger.Server.Domain.Exceptions;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Validation;

namespace DailyNagger.Server.Api.Tags;

public static class TagApi
{
    public static IEndpointRouteBuilder MapTagApi(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/tags", async (
            Guid communityId,
            Guid userId,
            string tagType,
            OperationsFacade operations,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var tags = await operations.Tags.GetAsync(
                    communityId,
                    userId,
                    tagType,
                    cancellationToken);

                return Results.Ok(tags);
            }
            catch (NagCommunityNotFoundException exception)
            {
                return ApiErrorResults.NotFound(exception.Message);
            }
            catch (Exception exception)
            {
                return ApiErrorResults.Problem(exception, environment);
            }
        })
            .WithTags("Tags")
            .Produces<TagDto[]>(StatusCodes.Status200OK);

        app.MapPut("/api/tags", async (
            SaveTagRequest request,
            RequestValidator validator,
            OperationsFacade operations,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                validator.Validate(request);

                var saved = await operations.Tags.SaveAsync(request, cancellationToken);

                return Results.Ok(saved);
            }
            catch (NagValidationException exception)
            {
                return ApiErrorResults.BadRequest(exception.Message);
            }
            catch (NagCommunityNotFoundException exception)
            {
                return ApiErrorResults.NotFound(exception.Message);
            }
            catch (Exception exception)
            {
                return ApiErrorResults.Problem(exception, environment);
            }
        })
            .WithTags("Tags")
            .Produces<TagDto>(StatusCodes.Status200OK);

        return app;
    }
}
