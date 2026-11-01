namespace DailyNagger.Server.Contracts.Nags;

public sealed record TaskStepNameSuggestionDto(string Name);

public sealed record NaggerDto(
    Guid Id,
    string Title,
    DateOnly? ActiveLogDueOn,
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
    Guid UserId,
    Guid Id,
    string Title,
    DateOnly? ActiveLogDueOn,
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
