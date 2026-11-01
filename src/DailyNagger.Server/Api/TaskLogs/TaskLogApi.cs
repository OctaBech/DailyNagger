using System.Text.Json;
using System.Text.Json.Serialization;
using DailyNagger.Server.Contracts;
using DailyNagger.Server.Contracts.TaskLogs;
using DailyNagger.Server.Data.Connections;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Validation;

namespace DailyNagger.Server.Api.TaskLogs;

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
            OperationsFacade operations,
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

                var taskLog = await operations.TaskLogs.SaveAsync(saveRequest, cancellationToken);

                return Results.Ok(taskLog);
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
        })
            .WithTags("TaskLogs")
            .Accepts<VersionedRequest<TaskLogDto>>("application/json")
            .Produces<TaskLogDto>(StatusCodes.Status200OK);

        app.MapPatch("/api/task-logs/{id:guid}/task-entries", async (
            Guid id,
            UpdateTaskEntryValuesRequest request,
            NagRequestValidator validator,
            OperationsFacade operations,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                validator.Validate(request);

                var result = await operations.TaskLogs.UpdateEntryValuesAsync(id, request, cancellationToken);

                return Results.Ok(result);
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
        })
            .WithTags("TaskLogs")
            .Produces<TaskLogVersionDto>(StatusCodes.Status200OK);

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
            CommunityId: versionedRequest.CommunityId,
            UserId: versionedRequest.UserId,
            Id: versionedRequest.Payload.Id,
            NagId: versionedRequest.Payload.NagId,
            CopiedFromTaskLogId: versionedRequest.Payload.CopiedFromTaskLogId,
            ClosedOn: versionedRequest.Payload.ClosedOn,
            TaskItems: versionedRequest.Payload.TaskItems,
            UpdatedAt: versionedRequest.Payload.UpdatedAt,
            BaseVersion: versionedRequest.BaseVersion,
            NextVersion: versionedRequest.NextVersion,
            Tag: versionedRequest.Payload.Tag,
            DescendantTaskItemCount: versionedRequest.Payload.DescendantTaskItemCount,
            DoneDescendantTaskItemCount: versionedRequest.Payload.DoneDescendantTaskItemCount,
            ClientIdentity: versionedRequest.ClientIdentity);
    }
}
