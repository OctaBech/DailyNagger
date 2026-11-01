using DailyNagger.Server.Data.Connections;
using DailyNagger.Server.Operations;

namespace DailyNagger.Server.Api;

public static class DemoApi
{
    // Keep in sync with the mobile demo editor identity.
    public static readonly Guid TemplateUserId = new("019a23d0-7c00-7000-8000-000000000001");
    public static IEndpointRouteBuilder MapDemoApi(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/demo/data", Copy).WithTags("Demo")
            .Produces<object>(StatusCodes.Status200OK);
        app.MapDelete("/api/demo/data", Delete).WithTags("Demo")
            .Produces<object>(StatusCodes.Status200OK);
        return app;
    }

    private static Task<IResult> Copy(Guid communityId, Guid userId, OperationsFacade operations, CancellationToken cancellationToken) =>
        Execute(communityId, userId, operations, copy: true, cancellationToken);

    private static Task<IResult> Delete(Guid communityId, Guid userId, OperationsFacade operations, CancellationToken cancellationToken) =>
        Execute(communityId, userId, operations, copy: false, cancellationToken);

    private static async Task<IResult> Execute(Guid communityId, Guid userId, OperationsFacade operations, bool copy, CancellationToken cancellationToken)
    {
        if (userId == Guid.Empty) return Results.BadRequest(new { error = "UserId is required." });
        if (communityId == Guid.Empty
            || !await operations.Demo.IsDemoCommunityAsync(communityId, cancellationToken))
            return Results.NotFound();

        try
        {
            if (copy)
            {
                if (!await operations.Demo.CopyAsync(communityId, TemplateUserId, userId, cancellationToken))
                    return Results.Conflict(new { error = "The demo template has no tasks." });
            }
            else
            {
                await operations.Demo.DeleteAsync(communityId, userId, cancellationToken);
            }
            return Results.Ok(new { });
        }
        catch (NagCommunityNotFoundException)
        {
            return Results.NotFound();
        }
    }
}
