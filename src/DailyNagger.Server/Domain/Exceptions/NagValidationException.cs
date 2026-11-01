namespace DailyNagger.Server.Domain.Exceptions;

public sealed class NagValidationException(string message) : Exception(message);
