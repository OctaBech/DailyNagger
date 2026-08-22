namespace DailyNagger.Server.Observability;

public static class ApiRequestContext
{
    private const string RequestIdItemKey = "DailyNagger.ApiRequestId";

    public static void Set(HttpContext context, string requestId)
    {
        context.Items[RequestIdItemKey] = requestId;
    }

    public static bool TryGet(HttpContext context, out string requestId)
    {
        if (context.Items.TryGetValue(RequestIdItemKey, out var value)
            && value is string storedRequestId)
        {
            requestId = storedRequestId;
            return true;
        }

        requestId = string.Empty;
        return false;
    }
}
