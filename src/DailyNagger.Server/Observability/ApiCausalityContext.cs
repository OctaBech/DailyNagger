namespace DailyNagger.Server.Observability;

public sealed record ApiCausalityInfo(string Id, string Keys);

public static class ApiCausalityContext
{
    private const string CausalityItemKey = "DailyNagger.ApiCausality";

    public static void Set(HttpContext context, ApiCausalityInfo causality)
    {
        context.Items[CausalityItemKey] = causality;
    }

    public static bool TryGet(HttpContext context, out ApiCausalityInfo causality)
    {
        if (context.Items.TryGetValue(CausalityItemKey, out var value)
            && value is ApiCausalityInfo storedCausality)
        {
            causality = storedCausality;
            return true;
        }

        causality = new ApiCausalityInfo(string.Empty, string.Empty);
        return false;
    }
}
