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

        var hasCausality = ApiCausality.TryGet(context, out var causality);
        if (hasCausality)
        {
            ApiCausalityContext.Set(context, causality);
        }

        SentrySdk.ConfigureScope(scope =>
        {
            scope.SetTag("requestId", requestId);
            scope.SetExtra("requestId", requestId);

            if (hasCausality)
            {
                scope.SetTag("dn.causality.id", causality.Id);
                scope.SetTag("dn.causality.keys", causality.Keys);
                scope.SetExtra("dn.causality.id", causality.Id);
                scope.SetExtra("dn.causality.keys", causality.Keys);
            }
        });

        using var requestIdProperty = LogContext.PushProperty("requestId", requestId);
        using var causalityIdProperty = hasCausality
            ? LogContext.PushProperty("dn.causality.id", causality.Id)
            : null;
        using var causalityKeysProperty = hasCausality
            ? LogContext.PushProperty("dn.causality.keys", causality.Keys)
            : null;

        await next(context);
    }
}
