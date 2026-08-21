namespace DailyNagger.Server.Observability;

public sealed class RequireApiRequestIdMiddleware(
    RequestDelegate next,
    ILogger<RequireApiRequestIdMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await next(context);
            return;
        }

        if (!ApiRequestId.TryGet(context, out var requestId))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;

            await Results.Problem(
                detail: "Missing or invalid API request id.",
                statusCode: StatusCodes.Status400BadRequest)
                .ExecuteAsync(context);

            return;
        }

        context.Response.Headers[ApiRequestHeaders.RequestId] = requestId;

        using var _ = logger.BeginScope(new Dictionary<string, object>
        {
            ["requestId"] = requestId
        });

        await next(context);
    }
}
