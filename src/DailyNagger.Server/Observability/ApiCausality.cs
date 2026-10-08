namespace DailyNagger.Server.Observability;

public static class ApiCausality
{
    public static bool TryGet(HttpContext context, out ApiCausalityInfo causality)
    {
        var values = context.Request.Headers[ApiRequestHeaders.CausalityKey];

        if (values.Count == 1 && !string.IsNullOrWhiteSpace(values[0]))
        {
            causality = new ApiCausalityInfo(values[0]!);
            return true;
        }

        causality = new ApiCausalityInfo(string.Empty);
        return false;
    }
}
