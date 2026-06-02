namespace DailyNagger.Server.Operations;

public sealed class DebugLogTarget
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public string? AppInstanceId { get; set; }

    public string? UserId { get; set; }

    public LogLevel MinimumLevel { get; set; } = LogLevel.Debug;

    public DateTimeOffset ExpiresAt { get; set; }

    public string? Reason { get; set; }
}
