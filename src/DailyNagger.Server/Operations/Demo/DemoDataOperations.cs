using DailyNagger.Server.Database;

namespace DailyNagger.Server.Operations.Demo;

public sealed class DemoDataOperations(DatabaseQueries queries, DatabaseCommands commands)
{
    public Task<bool> IsDemoCommunityAsync(Guid communityId, CancellationToken cancellationToken = default) =>
        queries.Control.IsDemoCommunityAsync(communityId, cancellationToken);

    public Task<bool> CopyAsync(Guid communityId, Guid templateUserId, Guid userId,
        CancellationToken cancellationToken = default) =>
        commands.Demo.CopyAsync(communityId, templateUserId, userId, cancellationToken);

    public Task DeleteAsync(Guid communityId, Guid userId, CancellationToken cancellationToken = default) =>
        commands.Demo.DeleteAsync(communityId, userId, cancellationToken);
}
