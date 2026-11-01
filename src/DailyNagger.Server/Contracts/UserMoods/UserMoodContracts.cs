namespace DailyNagger.Server.Contracts.UserMoods;

public sealed record UserMoodDto(
    Guid Id,
    Guid UserId,
    string Mood,
    DateTimeOffset RecordedAt,
    string? TimeZone,
    string? Locale,
    DateTimeOffset CreatedAt,
    string? CreatedByClientId,
    string? CreatedByDeviceName,
    string? CreatedByDeviceModel);

public sealed record SaveUserMoodPayload(
    Guid Id,
    string Mood,
    DateTimeOffset RecordedAt,
    string? TimeZone = null,
    string? Locale = null);

[method: System.Text.Json.Serialization.JsonConstructor]
public sealed record SaveUserMoodRequest(
    Guid CommunityId,
    Guid UserId,
    SaveUserMoodPayload Payload,
    ClientIdentityDto? ClientIdentity = null)
{
    public SaveUserMoodRequest(
        Guid communityId,
        Guid userId,
        Guid id,
        string mood,
        DateTimeOffset recordedAt,
        string? timeZone,
        string? locale,
        ClientIdentityDto? clientIdentity = null)
        : this(
            communityId,
            userId,
            new SaveUserMoodPayload(id, mood, recordedAt, timeZone, locale),
            clientIdentity)
    {
    }
}
