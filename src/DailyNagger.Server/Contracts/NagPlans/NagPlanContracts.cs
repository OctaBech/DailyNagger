using DailyNagger.Server.Contracts.Nags;
using DailyNagger.Server.Contracts.TaskLogs;

namespace DailyNagger.Server.Contracts.NagPlans;

public sealed record NagPlanDto(
    DateOnly Date,
    NagPlanNaggerDto[] Nags);

public sealed record NagPlanNaggerDto(
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
    TaskLogDto TaskLog,
    int Version);
