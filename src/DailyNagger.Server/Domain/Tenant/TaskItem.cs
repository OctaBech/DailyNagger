namespace DailyNagger.Server.Domain.Tenant;

public sealed class TaskItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; init; }
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
