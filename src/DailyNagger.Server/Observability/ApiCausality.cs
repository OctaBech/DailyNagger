namespace DailyNagger.Server.Observability;

public static class ApiCausality
{
    public static bool TryGet(HttpContext context, out ApiCausalityInfo causality)
    {
        var causalityId = context.Request.Headers[ApiRequestHeaders.CausalityId].ToString();
        var causalityKeys = context.Request.Headers[ApiRequestHeaders.CausalityKeys].ToString();

        if (!string.IsNullOrWhiteSpace(causalityId)
            && !string.IsNullOrWhiteSpace(causalityKeys))
        {
            causality = new ApiCausalityInfo(causalityId, causalityKeys);
            return true;
        }

        causality = new ApiCausalityInfo(string.Empty, string.Empty);
        return false;
    }
}
