using DailyNagger.Server.Contracts.TaskLogs;
using DailyNagger.Server.Domain.Exceptions;

namespace DailyNagger.Server.Validation.TaskLogs;

internal static class TaskLogRequestValidation
{
    public static void Validate(SaveTaskLogRequest request)
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

        RequestMetadataValidation.ValidateUpdatedAt(request.UpdatedAt);
        RequestMetadataValidation.ValidateClientIdentity(request.ClientIdentity);
        RequestMetadataValidation.ValidateVersionTransition(request.BaseVersion, request.NextVersion);

        foreach (var node in request.TaskItems)
        {
            TaskLogTreeValidation.ValidateTaskItem(request.Id, null, node, nodeIds, inputIds);
        }
    }

    public static void Validate(UpdateTaskEntryValuesRequest request)
    {
        if (request.UserId == Guid.Empty)
        {
            throw new NagValidationException("UserId is required.");
        }

        if (request.Payload.Length == 0)
        {
            throw new NagValidationException("At least one TaskEntry update is required.");
        }

        RequestMetadataValidation.ValidateUpdatedAt(request.UpdatedAt);
        RequestMetadataValidation.ValidateClientIdentity(request.ClientIdentity);
        RequestMetadataValidation.ValidateVersionTransition(request.BaseVersion, request.NextVersion);

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
}
