namespace DailyNagger.Server.Observability;

public static class ApiRequestId
{
    public static string GetOrCreate(HttpContext context)
    {
        var requestId = context.Request.Headers[ApiRequestHeaders.RequestId].ToString();

        if (Guid.TryParse(requestId, out var parsedRequestId))
        {
            return parsedRequestId.ToString("D");
        }

        return Guid.NewGuid().ToString("D");
    }
}
