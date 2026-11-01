using DailyNagger.Server.Contracts;
using DailyNagger.Server.Domain;

namespace DailyNagger.Server.Operations.Nags;

internal static class NagMapping
{
    public static NaggerDto ToDto(Nagger nag) =>
        new(
            nag.Id,
            nag.Title,
            nag.ActiveLogDueOn,
            nag.TargetTime,
            nag.IsDeactivated,
            ToDto(nag.PinnedBy),
            nag.UpdatedAt,
            nag.UpdatedByClientId,
            nag.UpdatedByDeviceName,
            nag.UpdatedByDeviceModel,
            nag.ScheduleRules.Select(ToDto).ToArray(),
            nag.Version);

    private static NaggerPinnedByDto ToDto(NaggerPinnedBy pinnedBy) =>
        pinnedBy switch
        {
            NaggerPinnedBy.None => NaggerPinnedByDto.None,
            NaggerPinnedBy.User => NaggerPinnedByDto.User,
            NaggerPinnedBy.Llm => NaggerPinnedByDto.Llm,
            NaggerPinnedBy.Community => NaggerPinnedByDto.Community,
            _ => throw new ArgumentOutOfRangeException(nameof(pinnedBy), pinnedBy, null)
        };

    public static NaggerPinnedBy ToDomain(NaggerPinnedByDto pinnedBy) =>
        pinnedBy switch
        {
            NaggerPinnedByDto.None => NaggerPinnedBy.None,
            NaggerPinnedByDto.User => NaggerPinnedBy.User,
            NaggerPinnedByDto.Llm => NaggerPinnedBy.Llm,
            NaggerPinnedByDto.Community => NaggerPinnedBy.Community,
            _ => throw new ArgumentOutOfRangeException(nameof(pinnedBy), pinnedBy, null)
        };

    private static ScheduleRuleDto ToDto(ScheduleRule rule) =>
        new(
            rule.Id,
            ToDto(rule.RuleType),
            rule.RuleJson);

    public static ScheduleRule ToDomain(Guid nagId, ScheduleRuleDto rule) =>
        new()
        {
            Id = rule.Id,
            NagId = nagId,
            RuleType = ToDomain(rule.RuleType),
            RuleJson = rule.RuleJson
        };

    private static ScheduleRuleTypeDto ToDto(ScheduleRuleType ruleType) =>
        ruleType switch
        {
            ScheduleRuleType.Weekday => ScheduleRuleTypeDto.Weekday,
            ScheduleRuleType.Date => ScheduleRuleTypeDto.Date,
            ScheduleRuleType.Holiday => ScheduleRuleTypeDto.Holiday,
            _ => throw new ArgumentOutOfRangeException(nameof(ruleType), ruleType, null)
        };

    private static ScheduleRuleType ToDomain(ScheduleRuleTypeDto ruleType) =>
        ruleType switch
        {
            ScheduleRuleTypeDto.Weekday => ScheduleRuleType.Weekday,
            ScheduleRuleTypeDto.Date => ScheduleRuleType.Date,
            ScheduleRuleTypeDto.Holiday => ScheduleRuleType.Holiday,
            _ => throw new ArgumentOutOfRangeException(nameof(ruleType), ruleType, null)
        };
}
