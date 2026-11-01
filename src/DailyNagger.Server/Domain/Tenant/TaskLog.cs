namespace DailyNagger.Server.Domain.Tenant;

public sealed class TaskLog
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; init; }
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
