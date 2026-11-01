using DailyNagger.Server.Contracts.Nags;
using DailyNagger.Server.Domain.Exceptions;

namespace DailyNagger.Server.Validation.Nags;

internal static class NagRequestValidation
{
    public static void Validate(SaveNagRequest request)
    {
        if (request.Id == Guid.Empty)
        {
            throw new NagValidationException("Id is required.");
        }

        if (request.UserId == Guid.Empty)
        {
            throw new NagValidationException("UserId is required.");
        }

        foreach (var rule in request.ScheduleRules)
        {
            ScheduleRuleValidation.ValidateRule(rule);
        }

        RequestMetadataValidation.ValidateUpdatedAt(request.UpdatedAt);
        RequestMetadataValidation.ValidateClientIdentity(request.ClientIdentity);
        RequestMetadataValidation.ValidateVersionTransition(request.BaseVersion, request.NextVersion);
    }
}
