namespace DailyNagger.Server.Operations;

public sealed class NagCommunity
{
    public Guid Id { get; init; }

    public required string Name { get; set; }

    public required string ConnectionStringTemplate { get; set; }

    public string? PasswordSecretName { get; set; }
}
