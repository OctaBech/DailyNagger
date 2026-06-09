using DailyNagger.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Operations;

public sealed class ControlDbRead(DailyNaggerControlDbContext db)
{
    public async Task<IReadOnlyList<Guid>> GetActiveNagCommunityIdsAsync(
        CancellationToken cancellationToken = default) =>
        await db.NagCommunities
            .Where(community => !community.IsDeactivated)
            .OrderBy(community => community.Id)
            .Select(community => community.Id)
            .ToListAsync(cancellationToken);

    public async Task<CommunityDbConnectionSettings> GetCommunityDbConnectionSettingsAsync(
        Guid communityId,
        CancellationToken cancellationToken = default)
    {
        var settings = await db.NagCommunities
            .Where(community => community.Id == communityId)
            .Select(community => new CommunityDbConnectionSettings(
                community.Id,
                community.ConnectionStringTemplate,
                community.PasswordSecretName))
            .SingleOrDefaultAsync(cancellationToken);

        if (settings is null)
        {
            throw new NagCommunityNotFoundException(communityId);
        }

        if (string.IsNullOrWhiteSpace(settings.ConnectionStringTemplate))
        {
            throw new InvalidOperationException(
                $"ConnectionStringTemplate is empty. NagCommunityId: {communityId}");
        }

        return settings;
    }
}
