namespace DailyNagger.Server.Observability;

public sealed class ApiRequestIdMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = ApiRequestId.GetOrCreate(context);

        context.Response.Headers[ApiRequestHeaders.RequestId] = requestId;

        await next(context);
    }
}
