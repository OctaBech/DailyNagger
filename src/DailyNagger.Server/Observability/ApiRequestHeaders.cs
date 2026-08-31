namespace DailyNagger.Server.Observability;

public static class ApiRequestHeaders
{
    public const string CausalityId = "X-DailyNagger-Causality-Id";
    public const string CausalityKeys = "X-DailyNagger-Causality-Keys";
    public const string RequestId = "X-DailyNagger-Request-Id";
}
