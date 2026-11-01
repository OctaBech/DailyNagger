using DailyNagger.Server.Contracts.UserMoods;
using DailyNagger.Server.Domain.Exceptions;

namespace DailyNagger.Server.Validation.UserMoods;

internal static class UserMoodRequestValidation
{
    public static void Validate(SaveUserMoodRequest request)
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

        RequestMetadataValidation.ValidateClientIdentity(request.ClientIdentity);
    }
}
