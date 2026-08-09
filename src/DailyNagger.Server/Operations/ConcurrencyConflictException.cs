namespace DailyNagger.Server.Operations;

public sealed class ConcurrencyConflictException(
    string message,
    int? currentVersion = null) : Exception(message)
{
    public int? CurrentVersion { get; } = currentVersion;
}
