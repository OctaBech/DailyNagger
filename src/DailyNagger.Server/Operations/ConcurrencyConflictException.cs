namespace DailyNagger.Server.Operations;

public sealed class ConcurrencyConflictException(string message) : Exception(message);
