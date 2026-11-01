namespace DailyNagger.Server.Domain.Tenant;

public sealed class NagPlanNagger
{
    public required Nagger Nagger { get; init; }
    public required TaskLog TaskLog { get; init; }
}
