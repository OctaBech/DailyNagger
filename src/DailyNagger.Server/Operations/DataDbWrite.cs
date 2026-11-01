using DailyNagger.Server.Contracts;
using DailyNagger.Server.Data.Connections;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations.Nags;
using DailyNagger.Server.Validation;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Operations;

public sealed class DataDbWrite(GetDataDbConnection getDataDbConnection)
{
    public async Task<Nagger> SaveNagAsync(
        Guid communityId,
        Guid userId,
        Guid nagId,
        string title,
        DateOnly? activeLogDueOn,
        TimeOnly? targetTime,
        bool isDeactivated,
        NaggerPinnedBy pinnedBy,
        DateTimeOffset updatedAt,
        ClientIdentityDto? clientIdentity,
        IReadOnlyList<ScheduleRule> scheduleRules,
        int baseVersion,
        int nextVersion,
        CancellationToken cancellationToken = default)
    {
        var copiedScheduleRules = scheduleRules
            .Select(rule => new ScheduleRule
            {
                Id = rule.Id,
                UserId = userId,
                NagId = nagId,
                RuleType = rule.RuleType,
                RuleJson = rule.RuleJson
            })
            .ToList();

        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        var currentVersion = await NagWriteCommands.GetNagVersionAsync(
            connection,
            transaction,
            nagId,
            userId,
            cancellationToken);

        var nag = new Nagger
        {
            Id = nagId,
            UserId = userId,
            Title = title,
            ActiveLogDueOn = activeLogDueOn,
            TargetTime = targetTime,
            IsDeactivated = isDeactivated,
            PinnedBy = pinnedBy,
            UpdatedAt = updatedAt,
            UpdatedByClientId = clientIdentity?.ClientId,
            UpdatedByDeviceName = clientIdentity?.DeviceName,
            UpdatedByDeviceModel = clientIdentity?.DeviceModel,
            Version = nextVersion,
            ScheduleRules = copiedScheduleRules
        };

        if (nextVersion <= baseVersion)
        {
            throw new NagValidationException("NextVersion must be greater than BaseVersion.");
        }

        if (currentVersion is null && baseVersion != 0)
        {
            throw new ConcurrencyConflictException("New Nagger requires baseVersion 0.");
        }

        var changedRows = await NagWriteCommands.UpsertAsync(
            connection,
            transaction,
            nag,
            currentVersion,
            baseVersion,
            cancellationToken);

        if (changedRows == 0)
        {
            throw new ConcurrencyConflictException(
                "Nagger version conflict.",
                currentVersion);
        }

        await NagWriteCommands.ReplaceScheduleRulesAsync(
            connection,
            transaction,
            nag,
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return nag;
    }
}
