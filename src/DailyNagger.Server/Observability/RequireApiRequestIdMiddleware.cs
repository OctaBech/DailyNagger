using Sentry;
using Serilog.Context;

namespace DailyNagger.Server.Observability;

public sealed class RequireApiRequestIdMiddleware(RequestDelegate next)
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

        ApiRequestContext.Set(context, requestId);
        SentrySdk.ConfigureScope(scope =>
        {
            scope.SetTag("requestId", requestId);
            scope.SetExtra("requestId", requestId);
        });

        using var _ = LogContext.PushProperty("requestId", requestId);

        await next(context);
    }
}
