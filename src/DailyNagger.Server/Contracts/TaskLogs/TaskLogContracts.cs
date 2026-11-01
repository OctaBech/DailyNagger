namespace DailyNagger.Server.Contracts.TaskLogs;

public sealed record TaskLogDto(
    Guid Id,
    Guid NagId,
    Guid? CopiedFromTaskLogId,
    DateTimeOffset? ClosedOn,
    DateTimeOffset UpdatedAt,
    string? UpdatedByClientId,
    string? UpdatedByDeviceName,
    string? UpdatedByDeviceModel,
    int Version,
    TaskItemDto[] TaskItems,
    string? Tag = null,
    int DescendantTaskItemCount = 0,
    int DoneDescendantTaskItemCount = 0);

public sealed record SaveTaskLogRequest(
    Guid CommunityId,
    Guid UserId,
    Guid Id,
    Guid NagId,
    Guid? CopiedFromTaskLogId,
    DateTimeOffset? ClosedOn,
    TaskItemDto[] TaskItems,
    DateTimeOffset UpdatedAt,
    [property: System.Text.Json.Serialization.JsonRequired]
    int BaseVersion,
    [property: System.Text.Json.Serialization.JsonRequired]
    int NextVersion,
    string? Tag = null,
    int DescendantTaskItemCount = 0,
    int DoneDescendantTaskItemCount = 0,
    ClientIdentityDto? ClientIdentity = null);

public sealed record TaskItemDto(
    Guid Id,
    Guid TaskLogId,
    Guid? ParentTaskItemId,
    string Name,
    TaskEntryDto[] TaskEntries,
    TaskItemDto[] TaskItems,
    string? Tag = null,
    bool IsDone = false,
    TaskItemRolloverBehaviorDto RolloverBehavior = TaskItemRolloverBehaviorDto.Keep,
    DateTimeOffset? InteractionAt = null,
    string? InteractionTimeZone = null,
    string? InteractionLocale = null,
    string? InteractionMood = null,
    DateTimeOffset? InteractionMoodAt = null,
    int DescendantTaskItemCount = 0,
    int DoneDescendantTaskItemCount = 0);

public enum TaskItemRolloverBehaviorDto
{
    Keep,
    RemoveWhenDone
}

public enum TaskEntryRolloverBehaviorDto
{
    Remove,
    MoveValueToHistory,
    CarryOverValue
}

public sealed record TaskEntryDto(
    Guid Id,
    Guid TaskLogId,
    Guid ParentTaskItemId,
    string Label,
    string? Description,
    TaskEntryValueTypeDto ValueType,
    string? Tag,
    string? Value,
    string? LastTaskRunReferenceValue = null,
    TaskEntryRolloverBehaviorDto RolloverBehavior = TaskEntryRolloverBehaviorDto.MoveValueToHistory,
    DateTimeOffset? InteractionAt = null,
    string? InteractionTimeZone = null,
    string? InteractionLocale = null,
    string? InteractionMood = null,
    DateTimeOffset? InteractionMoodAt = null);

public enum TaskEntryValueTypeDto
{
    Text,
    Integer,
    Decimal,
    Boolean
}

public sealed record UpdateTaskEntryValuesRequest(
    Guid CommunityId,
    Guid UserId,
    TaskEntryValueUpdateDto[] Payload,
    DateTimeOffset UpdatedAt,
    [property: System.Text.Json.Serialization.JsonRequired]
    int BaseVersion,
    [property: System.Text.Json.Serialization.JsonRequired]
    int NextVersion,
    ClientIdentityDto? ClientIdentity = null);

public sealed record TaskLogVersionDto(
    int Version,
    DateTimeOffset UpdatedAt);

public sealed record TaskEntryValueUpdateDto(
    Guid Id,
    string? Value,
    DateTimeOffset? InteractionAt = null,
    string? InteractionTimeZone = null,
    string? InteractionLocale = null,
    string? InteractionMood = null,
    DateTimeOffset? InteractionMoodAt = null);
