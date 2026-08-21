namespace DailyNagger.Server.Observability;

public sealed class UnhandledApiExceptionMiddleware(
    RequestDelegate next,
    ILogger<UnhandledApiExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            var requestId = ApiRequestId.GetRequired(context);

            logger.LogError(
                exception,
                "Unhandled API exception. RequestId: {RequestId} Method: {Method} Path: {Path}",
                requestId,
                context.Request.Method,
                context.Request.Path.Value);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Headers[ApiRequestHeaders.RequestId] = requestId;

            await Results.Problem(
                detail: "An unexpected server error occurred.",
                statusCode: StatusCodes.Status500InternalServerError,
                extensions: new Dictionary<string, object?>
                {
                    ["requestId"] = requestId
                })
                .ExecuteAsync(context);
        }
    }
}
