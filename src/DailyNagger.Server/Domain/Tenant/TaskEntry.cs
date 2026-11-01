namespace DailyNagger.Server.Domain.Tenant;

public sealed class TaskEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; init; }
    public Guid TaskLogId { get; init; }
    public Guid ParentTaskItemId { get; init; }
    public required string Label { get; init; }
    public string? Description { get; init; }
    public TaskEntryValueType ValueType { get; init; }
    public string? Tag { get; init; }
    public string? Value { get; init; }
    public string? LastTaskRunReferenceValue { get; init; }
    public RolloverBehavior RolloverBehavior { get; init; } = RolloverBehavior.Keep;
    public DateTimeOffset? InteractionAt { get; init; }
    public string? InteractionTimeZone { get; init; }
    public string? InteractionLocale { get; init; }
    public string? InteractionMood { get; init; }
    public DateTimeOffset? InteractionMoodAt { get; init; }
    public int SortOrder { get; init; }
}
