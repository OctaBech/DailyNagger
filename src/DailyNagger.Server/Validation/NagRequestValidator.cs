using DailyNagger.Server.Contracts.Nags;
using DailyNagger.Server.Contracts.Tags;
using DailyNagger.Server.Contracts.TaskLogs;
using DailyNagger.Server.Contracts.UserMoods;
using DailyNagger.Server.Validation.Nags;
using DailyNagger.Server.Validation.Tags;
using DailyNagger.Server.Validation.TaskLogs;
using DailyNagger.Server.Validation.UserMoods;

namespace DailyNagger.Server.Validation;

public sealed class NagRequestValidator
{
    public void Validate(SaveNagRequest request) => NagRequestValidation.Validate(request);

    public void Validate(SaveTaskLogRequest request) => TaskLogRequestValidation.Validate(request);

    public void Validate(UpdateTaskEntryValuesRequest request) => TaskLogRequestValidation.Validate(request);

    public void Validate(SaveTagRequest request) => TagRequestValidation.Validate(request);

    public void Validate(SaveUserMoodRequest request) => UserMoodRequestValidation.Validate(request);

    public static void ValidatePayloadVersion(
        int payloadVersion,
        int baseVersion,
        int nextVersion) =>
        RequestMetadataValidation.ValidatePayloadVersion(payloadVersion, baseVersion, nextVersion);
}
