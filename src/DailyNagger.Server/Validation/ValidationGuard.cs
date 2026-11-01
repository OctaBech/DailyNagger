using DailyNagger.Server.Domain.Exceptions;

namespace DailyNagger.Server.Validation;

internal static class ValidationGuard
{
    public static void Require(bool condition, string message)
    {
        if (!condition)
        {
            throw new NagValidationException(message);
        }
    }
}
