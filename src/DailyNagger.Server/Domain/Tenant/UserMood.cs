namespace DailyNagger.Server.Domain.Tenant;

public sealed class UserMood
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public required string Mood { get; init; }
    public DateTimeOffset RecordedAt { get; init; }
    public string? TimeZone { get; init; }
    public string? Locale { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public string? CreatedByClientId { get; init; }
    public string? CreatedByDeviceName { get; init; }
    public string? CreatedByDeviceModel { get; init; }
}
