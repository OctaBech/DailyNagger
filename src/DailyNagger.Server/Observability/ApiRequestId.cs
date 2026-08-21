namespace DailyNagger.Server.Observability;

public static class ApiRequestId
{
    public static string GetRequired(HttpContext context)
    {
        var headerValue = context.Request.Headers[ApiRequestHeaders.RequestId].ToString();

        if (Guid.TryParse(headerValue, out var parsedRequestId))
        {
            return parsedRequestId.ToString("D");
        }

        throw new InvalidOperationException("Missing or invalid API request id.");
    }
}
