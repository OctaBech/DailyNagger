namespace DailyNagger.Server.Contracts;

public sealed record NagDto(
    Guid Id,
    string Title,
    DateTimeOffset ScheduleUpdatedAt,
    DateOnly? ActiveLogDueOn,
    DateOnly? ExpiresOn,
    bool IsDeactivated,
    NagTimeDto[] NagTimes,
    int Version);

public sealed record SaveNagRequest(
    Guid CommunityId,
    Guid Id,
    string Title,
    DateOnly? ExpiresOn,
    bool IsDeactivated,
    NagTimeDto[] NagTimes,
    int? ExpectedVersion = null);

public sealed record NagPlanDto(
    DateOnly Date,
    NagPlanNagDto[] Nags);

public sealed record NagPlanNagDto(
    Guid Id,
    string Title,
    DateTimeOffset ScheduleUpdatedAt,
    DateOnly? ActiveLogDueOn,
    DateOnly? ExpiresOn,
    bool IsDeactivated,
    NagTimeDto[] NagTimes,
    NagLogDto NagLog,
    int Version);

public sealed record NagTimeDto(
    Guid Id,
    NagTimeTypeDto TimeType,
    DayOfWeek? DayOfWeek,
    int? DayOfMonth,
    int? MonthOfYear);

public enum NagTimeTypeDto
{
    Weekly,
    MonthlyDay,
    YearlyDate
}

public sealed record NagLogDto(
    Guid Id,
    Guid NagId,
    Guid? CopiedFromNagLogId,
    DateTimeOffset? ClosedOn,
    DateTimeOffset UpdatedAt,
    int Version,
    NagNodeDto[] NagNodes);

public sealed record SaveNagLogRequest(
    Guid CommunityId,
    Guid UserId,
    Guid Id,
    Guid NagId,
    Guid? CopiedFromNagLogId,
    DateTimeOffset? ClosedOn,
    NagNodeDto[] NagNodes,
    int? ExpectedVersion = null);

public sealed record NagNodeDto(
    Guid Id,
    Guid NagLogId,
    Guid? ParentNagNodeId,
    string Name,
    int SortOrder,
    NagInputDto[] NagInputs,
    NagNodeDto[] NagNodes);

public sealed record NagInputDto(
    Guid Id,
    Guid NagLogId,
    Guid ParentNagNodeId,
    string Label,
    string? Description,
    NagInputValueTypeDto ValueType,
    string? Unit,
    string? Value,
    int SortOrder,
    string? PreviousValue = null);

public enum NagInputValueTypeDto
{
    Text,
    Integer,
    Decimal,
    Boolean
}

public sealed record UpdateNagInputValuesRequest(
    Guid CommunityId,
    Guid UserId,
    NagInputValueUpdateDto[] NagInputs,
    int ExpectedVersion = 0);

public sealed record NagLogVersionDto(
    int Version,
    DateTimeOffset UpdatedAt);

public sealed record NagInputValueUpdateDto(
    Guid Id,
    string? Value);
