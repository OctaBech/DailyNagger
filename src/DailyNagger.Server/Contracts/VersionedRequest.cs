namespace DailyNagger.Server.Contracts;

public sealed record VersionedRequest<TPayload>(
    Guid CommunityId,
    Guid UserId,
    TPayload Payload,
    [property: System.Text.Json.Serialization.JsonRequired]
    int BaseVersion,
    [property: System.Text.Json.Serialization.JsonRequired]
    int NextVersion,
    bool SkipPayloadVersionValidation = false,
    ClientIdentityDto? ClientIdentity = null);
