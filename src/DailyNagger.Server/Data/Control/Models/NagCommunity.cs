namespace DailyNagger.Server.Data.Control.Models;

public sealed class NagCommunity
{
    public Guid Id { get; init; }

    public required string Name { get; set; }

    public required string ConnectionStringTemplate { get; set; }

    public string? PasswordSecretName { get; set; }

    public bool IsDeactivated { get; set; }

    public bool IsDemo { get; set; }
}
