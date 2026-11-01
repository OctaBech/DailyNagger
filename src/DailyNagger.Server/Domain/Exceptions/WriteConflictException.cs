namespace DailyNagger.Server.Domain.Exceptions;

public sealed class WriteConflictException(
    string message,
    int? currentVersion = null) : Exception(message)
{
    public int? CurrentVersion { get; } = currentVersion;
}
