using DailyNagger.Server.Contracts.NagPlans;
using DailyNagger.Server.Database;
using DailyNagger.Server.Mapping;

namespace DailyNagger.Server.Operations.NagPlans;

public sealed class NagPlanOperations(DatabaseQueries queries)
{
    public async Task<NagPlanDto> GetAsync(Guid communityId, Guid userId, DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var plan = await queries.NagPlans.GetNagPlanAsync(communityId, userId, date, cancellationToken);
        return NagPlanMapping.ToDto(plan);
    }
}
