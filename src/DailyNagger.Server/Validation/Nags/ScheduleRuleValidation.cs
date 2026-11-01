using System.Text.Json;
using DailyNagger.Server.Contracts.Nags;
using DailyNagger.Server.Domain.Exceptions;

namespace DailyNagger.Server.Validation.Nags;

internal static class ScheduleRuleValidation
{
    public static void ValidateRule(ScheduleRuleDto rule)
    {
        if (rule.Id == Guid.Empty)
        {
            throw new NagValidationException("ScheduleRule Id is required.");
        }

        switch (rule.RuleType)
        {
            case ScheduleRuleTypeDto.Weekday:
                ValidateWeekdayRuleBody(rule.RuleJson);
                break;

            case ScheduleRuleTypeDto.Date:
                ValidateDateRuleBody(rule.RuleJson);
                break;

            case ScheduleRuleTypeDto.Holiday:
                ValidateHolidayRuleBody(rule.RuleJson);
                break;

            default:
                throw new NagValidationException($"Unknown schedule rule type: {rule.RuleType}.");
        }
    }

    private static void ValidateWeekdayRuleBody(string ruleJson)
    {
        using var document = ParseRuleJson(ruleJson);
        var root = document.RootElement;
        var month = GetRequiredInt(root, "month");
        var position = GetRequiredInt(root, "position");
        var weekday = GetRequiredInt(root, "weekday");

        ValidationGuard.Require(month is >= 0 and <= 12, "Weekday schedule rule Month must be between 0 and 12.");
        ValidationGuard.Require(position is >= 0 and <= 5, "Weekday schedule rule Position must be between 0 and 5.");
        ValidationGuard.Require(weekday is >= 0 and <= 7, "Weekday schedule rule Weekday must be between 0 and 7.");
        ValidationGuard.Require(
            weekday != 0 || (month == 0 && position == 0),
            "Weekday schedule rule Every weekday requires Month and Position to be 0.");
    }

    private static void ValidateDateRuleBody(string ruleJson)
    {
        using var document = ParseRuleJson(ruleJson);
        var root = document.RootElement;

        ValidationGuard.Require(GetRequiredInt(root, "year") >= 0, "Date schedule rule Year must be 0 or later.");
        ValidationGuard.Require(root.TryGetProperty("month", out _), "Date schedule rules require month.");
        ValidationGuard.Require(GetRequiredInt(root, "month") is >= 0 and <= 12, "Date schedule rule Month must be between 0 and 12.");
        ValidationGuard.Require(GetRequiredInt(root, "dayOfMonth") is >= 0 and <= 32, "Date schedule rule DayOfMonth must be between 0 and 32.");
    }

    private static void ValidateHolidayRuleBody(string ruleJson)
    {
        using var document = ParseRuleJson(ruleJson);
        var root = document.RootElement;

        ValidationGuard.Require(!string.IsNullOrWhiteSpace(GetRequiredString(root, "countryCode")), "Holiday schedule rule CountryCode is required.");
        ValidationGuard.Require(!string.IsNullOrWhiteSpace(GetRequiredString(root, "holidayId")), "Holiday schedule rule HolidayId is required.");
    }

    private static JsonDocument ParseRuleJson(string ruleJson)
    {
        if (string.IsNullOrWhiteSpace(ruleJson))
        {
            throw new NagValidationException("ScheduleRule RuleJson is required.");
        }

        try
        {
            var document = JsonDocument.Parse(ruleJson);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                document.Dispose();
                throw new NagValidationException("ScheduleRule RuleJson must be a JSON object.");
            }

            return document;
        }
        catch (JsonException exception)
        {
            throw new NagValidationException($"ScheduleRule RuleJson is invalid JSON: {exception.Message}");
        }
    }

    private static int GetRequiredInt(JsonElement root, string propertyName)
    {
        ValidationGuard.Require(root.TryGetProperty(propertyName, out var property), $"ScheduleRule RuleJson requires {propertyName}.");
        ValidationGuard.Require(property.ValueKind == JsonValueKind.Number, $"ScheduleRule RuleJson {propertyName} must be a number.");
        ValidationGuard.Require(property.TryGetInt32(out var value), $"ScheduleRule RuleJson {propertyName} must be an integer.");

        return value;
    }

    private static string GetRequiredString(JsonElement root, string propertyName)
    {
        ValidationGuard.Require(root.TryGetProperty(propertyName, out var property), $"ScheduleRule RuleJson requires {propertyName}.");
        ValidationGuard.Require(property.ValueKind == JsonValueKind.String, $"ScheduleRule RuleJson {propertyName} must be a string.");

        return property.GetString() ?? "";
    }
}
