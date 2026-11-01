using DailyNagger.Server.Contracts.Tags;
using DailyNagger.Server.Domain.Exceptions;

namespace DailyNagger.Server.Validation.Tags;

internal static class TagRequestValidation
{
    public static void Validate(SaveTagRequest request)
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
}
