namespace DailyNagger.Server.Domain;

public enum NaggerPinnedBy
{
    None,
    User,
    Llm,
    Community
}

public sealed class Nagger
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Title { get; init; }
    public DateOnly? ActiveLogDueOn { get; init; }
    public DateOnly? ExpiresOn { get; init; }
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

public sealed class NagPlan
{
    public DateOnly Date { get; init; }
    public List<NagPlanNagger> Nags { get; init; } = [];
}

public sealed class NagPlanNagger
{
    public required Nagger Nagger { get; init; }
    public required TaskLog TaskLog { get; init; }
}

public sealed class ScheduleRule
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid NagId { get; init; }
    public ScheduleRuleType RuleType { get; init; }
    public required string RuleJson { get; init; }
}

public enum ScheduleRuleType
{
    Weekday,
    Date,
    Holiday
}

public sealed class TaskLog
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid NagId { get; init; }
    public Guid? CopiedFromTaskLogId { get; init; }
    public DateTimeOffset? ClosedOn { get; init; }
    public string? Tag { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
    public string? UpdatedByClientId { get; init; }
    public string? UpdatedByDeviceName { get; init; }
    public string? UpdatedByDeviceModel { get; init; }
    public int Version { get; init; }
    public int DescendantTaskItemCount { get; init; }
    public int DoneDescendantTaskItemCount { get; init; }
    public List<TaskItem> TaskItems { get; init; } = [];
}

public sealed class TaskItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid TaskLogId { get; init; }
    public Guid? ParentTaskItemId { get; init; }
    public required string Name { get; init; }
    public string? Tag { get; init; }
    public bool IsDone { get; init; }
    public RolloverBehavior RolloverBehavior { get; init; } = RolloverBehavior.Keep;
    public DateTimeOffset? InteractionAt { get; init; }
    public string? InteractionTimeZone { get; init; }
    public string? InteractionLocale { get; init; }
    public string? InteractionMood { get; init; }
    public DateTimeOffset? InteractionMoodAt { get; init; }
    public int DescendantTaskItemCount { get; init; }
    public int DoneDescendantTaskItemCount { get; init; }
    public int SortOrder { get; init; }
    public List<TaskEntry> TaskEntries { get; init; } = [];
}

public enum RolloverBehavior
{
    Keep,
    Remove,
    RemoveWhenDone,
    MoveValueToHistory,
    CarryOverValue
}

public sealed class TaskEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
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

public enum TaskEntryValueType
{
    Text,
    Integer,
    Decimal,
    Boolean
}

public sealed class UserTag
{
    public Guid UserId { get; init; }
    public required string TagType { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public DateTimeOffset? LastUsedAt { get; init; }
}

public sealed class UserMood
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public required string Mood { get; init; }
    public DateTimeOffset RecordedAt { get; init; }
    public string? TimeZone { get; init; }
    public string? Locale { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public string? CreatedByClientId { get; init; }
    public string? CreatedByDeviceName { get; init; }
    public string? CreatedByDeviceModel { get; init; }
}
