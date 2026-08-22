namespace DailyNagger.Server.Observability;

public static class ApiRequestId
{
    public static bool TryGet(HttpContext context, out string requestId)
    {
        var headerValue = context.Request.Headers[ApiRequestHeaders.RequestId].ToString();

        if (Guid.TryParse(headerValue, out var parsedRequestId))
        {
            requestId = parsedRequestId.ToString("D");
            return true;
        }

        requestId = string.Empty;
        return false;
    }
}
