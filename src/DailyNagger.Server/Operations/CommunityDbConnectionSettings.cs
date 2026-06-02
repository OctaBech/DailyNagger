namespace DailyNagger.Server.Operations;

public sealed record CommunityDbConnectionSettings(
    Guid NagCommunityId,
    string ConnectionStringTemplate,
    string? PasswordSecretName);
