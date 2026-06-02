namespace DailyNagger.Server.Operations;

public sealed class UserProfile
{
    public Guid Id { get; init; }

    public required string DisplayName { get; set; }

    public DateOnly? Birthday { get; set; }
}
