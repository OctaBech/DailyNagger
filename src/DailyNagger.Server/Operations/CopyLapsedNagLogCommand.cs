using DailyNagger.Server.Domain;

namespace DailyNagger.Server.Operations;

public sealed record CopyLapsedNagLogCommand(
    Guid CommunityId,
    Guid NagId,
    DateOnly ExpectedActiveLogDueOn,
    DateOnly Today,
    DateTimeOffset ClosedOn);

public interface ICopyLapsedNagLogCommandHandler
{
    Task<CopyLapsedNagLogResult> CopyLapsedNagLogAsync(
        Guid communityId,
        Guid nagId,
        DateOnly expectedActiveLogDueOn,
        DateOnly today,
        DateTimeOffset closedOn,
        CancellationToken cancellationToken = default);
}
