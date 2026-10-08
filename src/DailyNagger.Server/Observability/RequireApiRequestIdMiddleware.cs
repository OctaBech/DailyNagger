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
            scope.SetTag(ApiRequestHeaders.RequestId, requestId);
            scope.SetExtra(ApiRequestHeaders.RequestId, requestId);

            if (hasCausality)
            {
                scope.SetTag(ApiRequestHeaders.CausalityKey, causality.Key);
                scope.SetExtra(ApiRequestHeaders.CausalityKey, causality.Key);
            }
        });

        using var requestIdProperty = LogContext.PushProperty(ApiRequestHeaders.RequestId, requestId);
        using var causalityProperty = hasCausality
            ? LogContext.PushProperty(ApiRequestHeaders.CausalityKey, causality.Key)
            : null;

        await next(context);
    }
}
