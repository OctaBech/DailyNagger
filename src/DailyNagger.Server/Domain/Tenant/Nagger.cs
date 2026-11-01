namespace DailyNagger.Server.Domain.Tenant;

public sealed class Nagger
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; init; }
    public required string Title { get; init; }
    public DateOnly? ActiveLogDueOn { get; init; }
    public TimeOnly? TargetTime { get; init; }
    public bool IsDeactivated { get; init; }
    public NaggerPinnedBy PinnedBy { get; init; } = NaggerPinnedBy.None;
    public DateTimeOffset UpdatedAt { get; init; }
    public string? UpdatedByClientId { get; init; }
    public string? UpdatedByDeviceName { get; init; }
    public string? UpdatedByDeviceModel { get; init; }
    public int Version { get; init; }
    public List<ScheduleRule> ScheduleRules { get; init; } = [];
}
