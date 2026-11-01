namespace DailyNagger.Server.Data.Connections;

public sealed record CommunityDbConnectionSettings(
    Guid NagCommunityId,
    string ConnectionStringTemplate,
    string? PasswordSecretName);
