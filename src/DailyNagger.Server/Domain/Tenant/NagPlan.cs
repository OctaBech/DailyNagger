namespace DailyNagger.Server.Domain.Tenant;

public sealed class NagPlan
{
    public DateOnly Date { get; init; }
    public List<NagPlanNagger> Nags { get; init; } = [];
}
