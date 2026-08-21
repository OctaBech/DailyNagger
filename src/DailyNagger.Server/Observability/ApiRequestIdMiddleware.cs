namespace DailyNagger.Server.Observability;

public sealed class ApiRequestIdMiddleware(
    RequestDelegate next,
    ILogger<ApiRequestIdMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = ApiRequestId.GetOrCreate(context);

        context.Response.Headers[ApiRequestHeaders.RequestId] = requestId;

        using var _ = logger.BeginScope(new Dictionary<string, object>
        {
            ["requestId"] = requestId
        });

        await next(context);
    }
}
