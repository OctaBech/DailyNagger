namespace DailyNagger.Server.Domain.Tenant;

public sealed class ScheduleRule
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; init; }
    public Guid NagId { get; init; }
    public ScheduleRuleType RuleType { get; init; }
    public required string RuleJson { get; init; }
}
