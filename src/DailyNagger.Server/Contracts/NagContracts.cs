namespace DailyNagger.Server.Contracts;

public sealed record VersionedRequest<TPayload>(
    Guid CommunityId,
    Guid UserId,
    TPayload Payload,
    [property: System.Text.Json.Serialization.JsonRequired]
    int BaseVersion,
    [property: System.Text.Json.Serialization.JsonRequired]
    int NextVersion,
    bool SkipPayloadVersionValidation = false,
    ClientIdentityDto? ClientIdentity = null);

public sealed record ClientIdentityDto(
    string ClientId,
    string DeviceName,
    string DeviceModel);

public sealed record TaskStepNameSuggestionDto(string Name);

public sealed record NaggerDto(
    Guid Id,
    string Title,
    DateOnly? ActiveLogDueOn,
    DateOnly? ExpiresOn,
    TimeOnly? TargetTime,
    bool IsDeactivated,
    NaggerPinnedByDto PinnedBy,
    DateTimeOffset UpdatedAt,
    string? UpdatedByClientId,
    string? UpdatedByDeviceName,
    string? UpdatedByDeviceModel,
    ScheduleRuleDto[] ScheduleRules,
    int Version);

public sealed record SaveNagRequest(
    Guid CommunityId,
    Guid Id,
    string Title,
    DateOnly? ActiveLogDueOn,
    DateOnly? ExpiresOn,
    TimeOnly? TargetTime,
    bool IsDeactivated,
    NaggerPinnedByDto PinnedBy,
    ScheduleRuleDto[] ScheduleRules,
    DateTimeOffset UpdatedAt,
    [property: System.Text.Json.Serialization.JsonRequired]
    int BaseVersion,
    [property: System.Text.Json.Serialization.JsonRequired]
    int NextVersion,
    ClientIdentityDto? ClientIdentity = null);

public sealed record NagPlanDto(
    DateOnly Date,
    NagPlanNaggerDto[] Nags);

public sealed record NagPlanNaggerDto(
    Guid Id,
    string Title,
    DateOnly? ActiveLogDueOn,
    DateOnly? ExpiresOn,
    TimeOnly? TargetTime,
    bool IsDeactivated,
    NaggerPinnedByDto PinnedBy,
    DateTimeOffset UpdatedAt,
    string? UpdatedByClientId,
    string? UpdatedByDeviceName,
    string? UpdatedByDeviceModel,
    ScheduleRuleDto[] ScheduleRules,
    TaskLogDto TaskLog,
    int Version);

public enum NaggerPinnedByDto
{
    None,
    User,
    Llm,
    Community
}

public sealed record ScheduleRuleDto(
    Guid Id,
    ScheduleRuleTypeDto RuleType,
    string RuleJson);

public enum ScheduleRuleTypeDto
{
    Weekday,
    Date,
    Holiday
}

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

public sealed record TagDto(
    string Name,
    string? Description,
    DateTimeOffset? LastUsedAt);

public sealed record SaveTagRequest(
    Guid CommunityId,
    Guid UserId,
    string TagType,
    string Name,
    string? Description);

public sealed record UserMoodDto(
    Guid Id,
    Guid UserId,
    string Mood,
    DateTimeOffset RecordedAt,
    string? TimeZone,
    string? Locale,
    DateTimeOffset CreatedAt,
    string? CreatedByClientId,
    string? CreatedByDeviceName,
    string? CreatedByDeviceModel);

public sealed record SaveUserMoodPayload(
    Guid Id,
    string Mood,
    DateTimeOffset RecordedAt,
    string? TimeZone = null,
    string? Locale = null);

[method: System.Text.Json.Serialization.JsonConstructor]
public sealed record SaveUserMoodRequest(
    Guid CommunityId,
    Guid UserId,
    SaveUserMoodPayload Payload,
    ClientIdentityDto? ClientIdentity = null)
{
    public SaveUserMoodRequest(
        Guid communityId,
        Guid userId,
        Guid id,
        string mood,
        DateTimeOffset recordedAt,
        string? timeZone,
        string? locale,
        ClientIdentityDto? clientIdentity = null)
        : this(
            communityId,
            userId,
            new SaveUserMoodPayload(id, mood, recordedAt, timeZone, locale),
            clientIdentity)
    {
    }
}
