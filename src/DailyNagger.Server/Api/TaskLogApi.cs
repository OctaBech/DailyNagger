using System.Text.Json;
using System.Text.Json.Serialization;
using DailyNagger.Server.Contracts;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Validation;

namespace DailyNagger.Server.Api;

public static class TaskLogApi
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public static IEndpointRouteBuilder MapTaskLogApi(this IEndpointRouteBuilder app)
    {
        app.MapPut("/api/task-logs/{id:guid}", async (
            Guid id,
            JsonElement requestJson,
            NagRequestValidator validator,
            DataDbWrite dataDbWrite,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var saveRequest = ToSaveTaskLogRequest(requestJson);

                if (saveRequest.Id != id)
                {
                    return Results.BadRequest(new
                    {
                        error = "Route id must match request id."
                    });
                }

                validator.Validate(saveRequest);

                var taskLog = await dataDbWrite.SaveTaskLogAsync(
                    saveRequest.CommunityId,
                    saveRequest.UserId,
                    saveRequest.Id,
                    saveRequest.NagId,
                    saveRequest.CopiedFromTaskLogId,
                    saveRequest.ClosedOn,
                    saveRequest.Tag,
                    saveRequest.UpdatedAt,
                    saveRequest.ClientIdentity,
                    saveRequest.DescendantTaskItemCount,
                    saveRequest.DoneDescendantTaskItemCount,
                    saveRequest.BaseVersion,
                    saveRequest.NextVersion,
                    saveRequest.TaskItems
                        .SelectMany((node, sortOrder) => ToDomainTree(saveRequest.Id, null, sortOrder, node))
                        .ToArray(),
                    cancellationToken);

                return Results.Ok(ToDto(taskLog));
            }
            catch (NagValidationException exception)
            {
                return Results.BadRequest(new
                {
                    error = exception.Message
                });
            }
            catch (JsonException exception)
            {
                return Results.BadRequest(new
                {
                    error = exception.Message
                });
            }
            catch (NagCommunityNotFoundException exception)
            {
                return Results.NotFound(new
                {
                    error = exception.Message
                });
            }
            catch (ConcurrencyConflictException exception)
            {
                return Results.Conflict(new
                {
                    error = exception.Message,
                    currentVersion = exception.CurrentVersion
                });
            }
            catch (Exception exception)
            {
                return Results.Problem(
                    environment.IsDevelopment() ? exception.ToString() : exception.Message);
            }
        }).WithTags("TaskLogs");

        app.MapPatch("/api/task-logs/{id:guid}/task-entries", async (
            Guid id,
            UpdateTaskEntryValuesRequest request,
            NagRequestValidator validator,
            DataDbWrite dataDbWrite,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                validator.Validate(request);

                var result = await dataDbWrite.UpdateTaskEntryValuesAsync(
                    request.CommunityId,
                    id,
                    request.UpdatedAt,
                    request.ClientIdentity,
                    request.BaseVersion,
                    request.NextVersion,
                    request.Payload,
                    cancellationToken);

                return Results.Ok(new TaskLogVersionDto(
                    result.Version,
                    result.UpdatedAt));
            }
            catch (NagValidationException exception)
            {
                return Results.BadRequest(new
                {
                    error = exception.Message
                });
            }
            catch (NagCommunityNotFoundException exception)
            {
                return Results.NotFound(new
                {
                    error = exception.Message
                });
            }
            catch (ConcurrencyConflictException exception)
            {
                return Results.Conflict(new
                {
                    error = exception.Message,
                    currentVersion = exception.CurrentVersion
                });
            }
            catch (Exception exception)
            {
                return Results.Problem(
                    environment.IsDevelopment() ? exception.ToString() : exception.Message);
            }
        }).WithTags("TaskLogs");

        return app;
    }

    private static SaveTaskLogRequest ToSaveTaskLogRequest(JsonElement requestJson)
    {
        if (!requestJson.TryGetProperty("payload", out _))
        {
            return requestJson.Deserialize<SaveTaskLogRequest>(JsonOptions)
                ?? throw new JsonException("TaskLog request body is required.");
        }

        var versionedRequest = requestJson.Deserialize<VersionedRequest<TaskLogDto>>(
            JsonOptions)
            ?? throw new JsonException("TaskLog request body is required.");

        if (versionedRequest.Payload is null)
        {
            throw new JsonException("TaskLog request payload is required.");
        }

        if (!versionedRequest.SkipPayloadVersionValidation)
        {
            NagRequestValidator.ValidatePayloadVersion(
                versionedRequest.Payload.Version,
                versionedRequest.BaseVersion,
                versionedRequest.NextVersion);
        }

        return new SaveTaskLogRequest(
            versionedRequest.CommunityId,
            versionedRequest.UserId,
            versionedRequest.Payload.Id,
            versionedRequest.Payload.NagId,
            versionedRequest.Payload.CopiedFromTaskLogId,
            versionedRequest.Payload.ClosedOn,
            versionedRequest.Payload.Tag,
            versionedRequest.Payload.TaskItems,
            versionedRequest.Payload.UpdatedAt,
            versionedRequest.BaseVersion,
            versionedRequest.NextVersion,
            versionedRequest.Payload.DescendantTaskItemCount,
            versionedRequest.Payload.DoneDescendantTaskItemCount,
            versionedRequest.ClientIdentity);
    }

    private static TaskLogDto ToDto(TaskLog taskLog) =>
        new(
            taskLog.Id,
            taskLog.NagId,
            taskLog.CopiedFromTaskLogId,
            taskLog.ClosedOn,
            taskLog.Tag,
            taskLog.UpdatedAt,
            taskLog.UpdatedByClientId,
            taskLog.UpdatedByDeviceName,
            taskLog.UpdatedByDeviceModel,
            taskLog.Version,
            taskLog.TaskItems
                .Where(node => node.ParentTaskItemId is null)
                .OrderBy(node => node.SortOrder)
                .Select(node => ToDto(node, taskLog.TaskItems))
                .ToArray(),
            taskLog.DescendantTaskItemCount,
            taskLog.DoneDescendantTaskItemCount);

    private static TaskItemDto ToDto(
        TaskItem node,
        IReadOnlyList<TaskItem> allNodes) =>
        new(
            node.Id,
            node.TaskLogId,
            node.ParentTaskItemId,
            node.Name,
            node.Tag,
            node.TaskEntries
                .OrderBy(input => input.SortOrder)
                .Select(ToDto)
                .ToArray(),
            allNodes
                .Where(child => child.ParentTaskItemId == node.Id)
                .OrderBy(child => child.SortOrder)
                .Select(child => ToDto(child, allNodes))
                .ToArray(),
            node.IsDone,
            ToDto(node.RolloverBehavior),
            node.InteractionAt,
            node.InteractionTimeZone,
            node.InteractionLocale,
            node.InteractionMood,
            node.InteractionMoodAt,
            node.DescendantTaskItemCount,
            node.DoneDescendantTaskItemCount);

    private static TaskEntryDto ToDto(TaskEntry input) =>
        new(
            input.Id,
            input.TaskLogId,
            input.ParentTaskItemId,
            input.Label,
            input.Description,
            ToDto(input.ValueType),
            input.Tag,
            input.Value,
            input.LastTaskRunReferenceValue,
            ToDto(input.RolloverBehavior),
            input.InteractionAt,
            input.InteractionTimeZone,
            input.InteractionLocale,
            input.InteractionMood,
            input.InteractionMoodAt);

    private static IEnumerable<TaskItem> ToDomainTree(
        Guid taskLogId,
        Guid? parentTaskItemId,
        int sortOrder,
        TaskItemDto node)
    {
        yield return new TaskItem
        {
            Id = node.Id,
            TaskLogId = taskLogId,
            ParentTaskItemId = parentTaskItemId,
            Name = node.Name.Trim(),
            Tag = string.IsNullOrWhiteSpace(node.Tag)
                ? null
                : node.Tag.Trim(),
            IsDone = node.IsDone,
            RolloverBehavior = ToDomain(node.RolloverBehavior),
            InteractionAt = node.InteractionAt,
            InteractionTimeZone = string.IsNullOrWhiteSpace(node.InteractionTimeZone)
                ? null
                : node.InteractionTimeZone.Trim(),
            InteractionLocale = string.IsNullOrWhiteSpace(node.InteractionLocale)
                ? null
                : node.InteractionLocale.Trim(),
            InteractionMood = string.IsNullOrWhiteSpace(node.InteractionMood)
                ? null
                : node.InteractionMood.Trim(),
            InteractionMoodAt = node.InteractionMoodAt,
            DescendantTaskItemCount = node.DescendantTaskItemCount,
            DoneDescendantTaskItemCount = node.DoneDescendantTaskItemCount,
            SortOrder = sortOrder,
            TaskEntries = node.TaskEntries
                .Select((input, inputSortOrder) => ToDomain(taskLogId, node.Id, inputSortOrder, input))
                .ToList()
        };

        foreach (var child in node.TaskItems.SelectMany((child, childSortOrder) =>
            ToDomainTree(taskLogId, node.Id, childSortOrder, child)))
        {
            yield return child;
        }
    }

    private static TaskEntry ToDomain(
        Guid taskLogId,
        Guid parentTaskItemId,
        int sortOrder,
        TaskEntryDto input) =>
        new()
        {
            Id = input.Id,
            TaskLogId = taskLogId,
            ParentTaskItemId = parentTaskItemId,
            Label = input.Label?.Trim() ?? "",
            Description = string.IsNullOrWhiteSpace(input.Description)
                ? null
                : input.Description.Trim(),
            ValueType = ToDomain(input.ValueType),
            Tag = string.IsNullOrWhiteSpace(input.Tag)
                ? null
                : input.Tag.Trim(),
            Value = input.Value,
            LastTaskRunReferenceValue = input.LastTaskRunReferenceValue,
            RolloverBehavior = ToDomain(input.RolloverBehavior),
            InteractionAt = input.InteractionAt,
            InteractionTimeZone = string.IsNullOrWhiteSpace(input.InteractionTimeZone)
                ? null
                : input.InteractionTimeZone.Trim(),
            InteractionLocale = string.IsNullOrWhiteSpace(input.InteractionLocale)
                ? null
                : input.InteractionLocale.Trim(),
            InteractionMood = string.IsNullOrWhiteSpace(input.InteractionMood)
                ? null
                : input.InteractionMood.Trim(),
            InteractionMoodAt = input.InteractionMoodAt,
            SortOrder = sortOrder
        };

    private static TaskEntryValueTypeDto ToDto(TaskEntryValueType valueType) =>
        valueType switch
        {
            TaskEntryValueType.Text => TaskEntryValueTypeDto.Text,
            TaskEntryValueType.Integer => TaskEntryValueTypeDto.Integer,
            TaskEntryValueType.Decimal => TaskEntryValueTypeDto.Decimal,
            TaskEntryValueType.Boolean => TaskEntryValueTypeDto.Boolean,
            _ => throw new ArgumentOutOfRangeException(nameof(valueType), valueType, null)
        };

    private static RolloverBehaviorDto ToDto(RolloverBehavior rolloverBehavior) =>
        rolloverBehavior switch
        {
            RolloverBehavior.Keep => RolloverBehaviorDto.Keep,
            RolloverBehavior.Remove => RolloverBehaviorDto.Remove,
            RolloverBehavior.RemoveWhenDone => RolloverBehaviorDto.RemoveWhenDone,
            RolloverBehavior.MoveValueToHistory => RolloverBehaviorDto.MoveValueToHistory,
            RolloverBehavior.CarryOverValue => RolloverBehaviorDto.CarryOverValue,
            _ => throw new ArgumentOutOfRangeException(nameof(rolloverBehavior), rolloverBehavior, null)
        };

    private static RolloverBehavior ToDomain(RolloverBehaviorDto rolloverBehavior) =>
        rolloverBehavior switch
        {
            RolloverBehaviorDto.Keep => RolloverBehavior.Keep,
            RolloverBehaviorDto.Remove => RolloverBehavior.Remove,
            RolloverBehaviorDto.RemoveWhenDone => RolloverBehavior.RemoveWhenDone,
            RolloverBehaviorDto.MoveValueToHistory => RolloverBehavior.MoveValueToHistory,
            RolloverBehaviorDto.CarryOverValue => RolloverBehavior.CarryOverValue,
            _ => throw new ArgumentOutOfRangeException(nameof(rolloverBehavior), rolloverBehavior, null)
        };

    private static TaskEntryValueType ToDomain(TaskEntryValueTypeDto valueType) =>
        valueType switch
        {
            TaskEntryValueTypeDto.Text => TaskEntryValueType.Text,
            TaskEntryValueTypeDto.Integer => TaskEntryValueType.Integer,
            TaskEntryValueTypeDto.Decimal => TaskEntryValueType.Decimal,
            TaskEntryValueTypeDto.Boolean => TaskEntryValueType.Boolean,
            _ => throw new ArgumentOutOfRangeException(nameof(valueType), valueType, null)
        };
}
