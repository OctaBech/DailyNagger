using System.Text.Json;
using DailyNagger.Server.Contracts;

namespace DailyNagger.Server.Validation;

public sealed class NagRequestValidator
{
    public void Validate(SaveNagRequest request)
    {
        if (request.Id == Guid.Empty)
        {
            throw new NagValidationException("Id is required.");
        }

        foreach (var rule in request.ScheduleRules)
        {
            ValidateRule(rule);
        }

        ValidateUpdatedAt(request.UpdatedAt);
        ValidateClientIdentity(request.ClientIdentity);
        ValidateVersionTransition(request.BaseVersion, request.NextVersion);
    }

    public void Validate(SaveTaskLogRequest request)
    {
        if (request.Id == Guid.Empty)
        {
            throw new NagValidationException("Id is required.");
        }

        if (request.UserId == Guid.Empty)
        {
            throw new NagValidationException("UserId is required.");
        }

        if (request.NagId == Guid.Empty)
        {
            throw new NagValidationException("NagId is required.");
        }

        var nodeIds = new HashSet<Guid>();
        var inputIds = new HashSet<Guid>();

        ValidateUpdatedAt(request.UpdatedAt);
        ValidateClientIdentity(request.ClientIdentity);
        ValidateVersionTransition(request.BaseVersion, request.NextVersion);

        foreach (var node in request.TaskItems)
        {
            ValidateTaskItem(request.Id, null, node, nodeIds, inputIds);
        }
    }

    public void Validate(UpdateTaskEntryValuesRequest request)
    {
        if (request.UserId == Guid.Empty)
        {
            throw new NagValidationException("UserId is required.");
        }

        if (request.Payload.Length == 0)
        {
            throw new NagValidationException("At least one TaskEntry update is required.");
        }

        ValidateUpdatedAt(request.UpdatedAt);
        ValidateClientIdentity(request.ClientIdentity);
        ValidateVersionTransition(request.BaseVersion, request.NextVersion);

        var inputIds = new HashSet<Guid>();

        foreach (var input in request.Payload)
        {
            if (input.Id == Guid.Empty)
            {
                throw new NagValidationException("TaskEntry Id is required.");
            }

            if (!inputIds.Add(input.Id))
            {
                throw new NagValidationException("TaskEntry Id values must be unique.");
            }
        }
    }

    public void Validate(SaveTagRequest request)
    {
        if (request.UserId == Guid.Empty)
        {
            throw new NagValidationException("UserId is required.");
        }

        if (string.IsNullOrWhiteSpace(request.TagType))
        {
            throw new NagValidationException("TagType is required.");
        }

        if (request.TagType.Trim().Length > 100)
        {
            throw new NagValidationException("TagType cannot be longer than 100 characters.");
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new NagValidationException("Tag name is required.");
        }

        if (request.Name.Trim().Length > 50)
        {
            throw new NagValidationException("Tag name cannot be longer than 50 characters.");
        }

        if (request.Description is { Length: > 1000 })
        {
            throw new NagValidationException("Tag description cannot be longer than 1000 characters.");
        }
    }

    public void Validate(SaveUserMoodRequest request)
    {
        if (request.UserId == Guid.Empty)
        {
            throw new NagValidationException("UserId is required.");
        }

        if (request.Payload.Id == Guid.Empty)
        {
            throw new NagValidationException("UserMood Id is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Payload.Mood))
        {
            throw new NagValidationException("Mood is required.");
        }

        if (request.Payload.Mood.Trim().Length > 50)
        {
            throw new NagValidationException("Mood cannot be longer than 50 characters.");
        }

        if (request.Payload.RecordedAt == default)
        {
            throw new NagValidationException("RecordedAt is required.");
        }

        if (request.Payload.TimeZone is { Length: > 100 })
        {
            throw new NagValidationException("TimeZone cannot be longer than 100 characters.");
        }

        if (request.Payload.Locale is { Length: > 50 })
        {
            throw new NagValidationException("Locale cannot be longer than 50 characters.");
        }

        ValidateClientIdentity(request.ClientIdentity);
    }

    public static void ValidatePayloadVersion(
        int payloadVersion,
        int baseVersion,
        int nextVersion)
    {
        Require(
            payloadVersion >= baseVersion && payloadVersion < nextVersion,
            "Payload Version must be between BaseVersion and before NextVersion.");
    }

    private static void ValidateRule(ScheduleRuleDto rule)
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

        Require(month is >= 0 and <= 12, "Weekday schedule rule Month must be between 0 and 12.");
        Require(position is >= 0 and <= 5, "Weekday schedule rule Position must be between 0 and 5.");
        Require(weekday is >= 0 and <= 7, "Weekday schedule rule Weekday must be between 0 and 7.");
        Require(
            weekday != 0 || (month == 0 && position == 0),
            "Weekday schedule rule Every weekday requires Month and Position to be 0.");
    }

    private static void ValidateDateRuleBody(string ruleJson)
    {
        using var document = ParseRuleJson(ruleJson);
        var root = document.RootElement;

        Require(GetRequiredInt(root, "year") >= 0, "Date schedule rule Year must be 0 or later.");
        Require(root.TryGetProperty("month", out _), "Date schedule rules require month.");
        Require(GetRequiredInt(root, "month") is >= 0 and <= 12, "Date schedule rule Month must be between 0 and 12.");
        Require(GetRequiredInt(root, "dayOfMonth") is >= 0 and <= 32, "Date schedule rule DayOfMonth must be between 0 and 32.");
    }

    private static void ValidateHolidayRuleBody(string ruleJson)
    {
        using var document = ParseRuleJson(ruleJson);
        var root = document.RootElement;

        Require(!string.IsNullOrWhiteSpace(GetRequiredString(root, "countryCode")), "Holiday schedule rule CountryCode is required.");
        Require(!string.IsNullOrWhiteSpace(GetRequiredString(root, "holidayId")), "Holiday schedule rule HolidayId is required.");
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
            Require(document.RootElement.ValueKind == JsonValueKind.Object, "ScheduleRule RuleJson must be a JSON object.");

            return document;
        }
        catch (JsonException exception)
        {
            throw new NagValidationException($"ScheduleRule RuleJson is invalid JSON: {exception.Message}");
        }
    }

    private static int GetRequiredInt(JsonElement root, string propertyName)
    {
        Require(root.TryGetProperty(propertyName, out var property), $"ScheduleRule RuleJson requires {propertyName}.");
        Require(property.ValueKind == JsonValueKind.Number, $"ScheduleRule RuleJson {propertyName} must be a number.");
        Require(property.TryGetInt32(out var value), $"ScheduleRule RuleJson {propertyName} must be an integer.");

        return value;
    }

    private static string GetRequiredString(JsonElement root, string propertyName)
    {
        Require(root.TryGetProperty(propertyName, out var property), $"ScheduleRule RuleJson requires {propertyName}.");
        Require(property.ValueKind == JsonValueKind.String, $"ScheduleRule RuleJson {propertyName} must be a string.");

        return property.GetString() ?? "";
    }

    private static void ValidateUpdatedAt(DateTimeOffset updatedAt)
    {
        if (updatedAt == default)
        {
            throw new NagValidationException("UpdatedAt is required.");
        }
    }

    private static void ValidateClientIdentity(ClientIdentityDto? clientIdentity)
    {
        if (clientIdentity is null)
        {
            return;
        }

        Require(!string.IsNullOrWhiteSpace(clientIdentity.ClientId), "ClientIdentity ClientId is required.");
        Require(clientIdentity.ClientId.Length <= 100, "ClientIdentity ClientId cannot be longer than 100 characters.");
        Require(!string.IsNullOrWhiteSpace(clientIdentity.DeviceName), "ClientIdentity DeviceName is required.");
        Require(clientIdentity.DeviceName.Length <= 200, "ClientIdentity DeviceName cannot be longer than 200 characters.");
        Require(!string.IsNullOrWhiteSpace(clientIdentity.DeviceModel), "ClientIdentity DeviceModel is required.");
        Require(clientIdentity.DeviceModel.Length <= 200, "ClientIdentity DeviceModel cannot be longer than 200 characters.");
    }

    private static void ValidateTaskItem(
        Guid taskLogId,
        Guid? expectedParentTaskItemId,
        TaskItemDto node,
        HashSet<Guid> nodeIds,
        HashSet<Guid> inputIds)
    {
        if (node.Id == Guid.Empty)
        {
            throw new NagValidationException("TaskItem Id is required.");
        }

        if (node.TaskLogId != taskLogId)
        {
            throw new NagValidationException("TaskItem TaskLogId must match the requested TaskLog.");
        }

        if (node.ParentTaskItemId != expectedParentTaskItemId)
        {
            throw new NagValidationException("TaskItem ParentTaskItemId must match its nested position.");
        }

        if (!nodeIds.Add(node.Id))
        {
            throw new NagValidationException("TaskItem Id values must be unique.");
        }

        if (string.IsNullOrWhiteSpace(node.Name))
        {
            throw new NagValidationException("TaskItem Name is required.");
        }

        foreach (var input in node.TaskEntries)
        {
            ValidateTaskEntry(taskLogId, node.Id, input, inputIds);
        }

        foreach (var child in node.TaskItems)
        {
            ValidateTaskItem(taskLogId, node.Id, child, nodeIds, inputIds);
        }
    }

    private static void ValidateTaskEntry(
        Guid taskLogId,
        Guid expectedParentTaskItemId,
        TaskEntryDto input,
        HashSet<Guid> inputIds)
    {
        if (input.Id == Guid.Empty)
        {
            throw new NagValidationException("TaskEntry Id is required.");
        }

        if (input.TaskLogId != taskLogId)
        {
            throw new NagValidationException("TaskEntry TaskLogId must match the requested TaskLog.");
        }

        if (input.ParentTaskItemId != expectedParentTaskItemId)
        {
            throw new NagValidationException("TaskEntry ParentTaskItemId must match its parent TaskItem.");
        }

        if (!inputIds.Add(input.Id))
        {
            throw new NagValidationException("TaskEntry Id values must be unique.");
        }

        TaskEntryValueValidator.Validate(input.ValueType, input.Value);
    }

    private static void Require(bool condition, string message)
    {
        if (!condition)
        {
            throw new NagValidationException(message);
        }
    }

    private static void ValidateVersionTransition(
        int baseVersion,
        int nextVersion)
    {
        Require(nextVersion > baseVersion, "NextVersion must be greater than BaseVersion.");
    }
}

public sealed class NagValidationException(string message) : Exception(message);
