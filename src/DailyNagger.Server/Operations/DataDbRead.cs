using DailyNagger.Server.Domain;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Operations;

public sealed class DataDbRead(GetDataDbConnection getDataDbConnection)
{
    public async Task<IReadOnlyList<LapsedNag>> GetLapsedNagAsync(
        Guid communityId,
        DateOnly today,
        DateTimeOffset now,
        TimeSpan copyGracePeriod,
        CancellationToken cancellationToken = default)
    {
        if (copyGracePeriod < TimeSpan.Zero)
        {
            throw new InvalidOperationException("Nag copy grace period must be 0 or greater.");
        }

        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var command = new SqlCommand(
            """
            select
                nag.id,
                nag.active_log_due_on
            from nag
            inner join nag_log on nag_log.nag_id = nag.id
            where nag.is_deactivated = 0
                and nag.active_log_due_on is not null
                and nag.active_log_due_on < @today
                and nag_log.closed_on is null
                and nag_log.updated_at < @updatedBefore
            order by nag.active_log_due_on, nag.id
            """,
            connection);

        command.Parameters.AddWithValue("@today", today);
        command.Parameters.AddWithValue("@updatedBefore", now - copyGracePeriod);

        var lapsedNag = new List<LapsedNag>();

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            lapsedNag.Add(new LapsedNag(
                reader.GetGuid(0),
                DateOnly.FromDateTime(reader.GetDateTime(1))));
        }

        return lapsedNag;
    }

    public async Task<NagPlan> GetNagPlanAsync(
        Guid communityId,
        Guid userId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        var plan = new NagPlan
        {
            Date = date
        };

        await using var command = new SqlCommand(
            """
            select
                nag.id,
                nag.title,
                nag.schedule_updated_at,
                nag.active_log_due_on,
                nag.expires_on,
                nag.is_deactivated,
                nag.version,
                nag_log.id,
                nag_log.copied_from_nag_log_id,
                nag_log.closed_on,
                nag_log.updated_at,
                nag_log.version
            from nag
            inner join nag_log on nag_log.nag_id = nag.id
            where nag.is_deactivated = 0
                and nag_log.closed_on is null
            order by nag.id
            """,
            connection);

        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                plan.Nags.Add(new NagPlanNag
                {
                    Nag = new Nag
                    {
                        Id = reader.GetGuid(0),
                        Title = reader.GetString(1),
                        ScheduleUpdatedAt = reader.GetDateTimeOffset(2),
                        ActiveLogDueOn = reader.IsDBNull(3)
                            ? null
                            : DateOnly.FromDateTime(reader.GetDateTime(3)),
                        ExpiresOn = reader.IsDBNull(4)
                            ? null
                            : DateOnly.FromDateTime(reader.GetDateTime(4)),
                        IsDeactivated = reader.GetBoolean(5),
                        Version = reader.GetInt32(6)
                    },
                    NagLog = new NagLog
                    {
                        Id = reader.GetGuid(7),
                        NagId = reader.GetGuid(0),
                        CopiedFromNagLogId = reader.IsDBNull(8) ? null : reader.GetGuid(8),
                        ClosedOn = reader.IsDBNull(9) ? null : reader.GetDateTimeOffset(9),
                        UpdatedAt = reader.GetDateTimeOffset(10),
                        Version = reader.GetInt32(11)
                    }
                });
            }
        }

        foreach (var item in plan.Nags)
        {
            item.Nag.NagTimes.AddRange(await GetNagTimesAsync(
                connection,
                item.Nag.Id,
                cancellationToken));

            item.NagLog.NagNodes.AddRange(await GetNagNodesAsync(
                connection,
                item.NagLog.Id,
                cancellationToken));
        }

        return plan;
    }

    public async Task<IReadOnlyList<Nag>> GetNagAsync(
        Guid communityId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var command = new SqlCommand(
            """
            select
                nag.id,
                nag.title,
                nag.schedule_updated_at,
                nag.active_log_due_on,
                nag.expires_on,
                nag.is_deactivated,
                nag.version
            from nag
            order by nag.id
            """,
            connection);

        var nag = new List<Nag>();

        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                nag.Add(new Nag
                {
                    Id = reader.GetGuid(0),
                    Title = reader.GetString(1),
                    ScheduleUpdatedAt = reader.GetDateTimeOffset(2),
                    ActiveLogDueOn = reader.IsDBNull(3)
                        ? null
                        : DateOnly.FromDateTime(reader.GetDateTime(3)),
                    ExpiresOn = reader.IsDBNull(4)
                        ? null
                        : DateOnly.FromDateTime(reader.GetDateTime(4)),
                    IsDeactivated = reader.GetBoolean(5),
                    Version = reader.GetInt32(6)
                });
            }
        }

        foreach (var item in nag)
        {
            item.NagTimes.AddRange(await GetNagTimesAsync(
                connection,
                item.Id,
                cancellationToken));
        }

        return nag;
    }

    public async Task<IReadOnlyList<string>> GetNagInputUnitSuggestionsAsync(
        Guid communityId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var command = new SqlCommand(
            """
            select unit
            from nag_input_unit_suggestion
            where user_id = @userId
            order by unit
            """,
            connection);

        command.Parameters.AddWithValue("@userId", userId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var units = new List<string>();

        while (await reader.ReadAsync(cancellationToken))
        {
            units.Add(reader.GetString(0));
        }

        return units;
    }

    private static async Task<IReadOnlyList<NagNode>> GetNagNodesAsync(
        SqlConnection connection,
        Guid nagLogId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select id, parent_nag_node_id, name, sort_order
            from nag_node
            where nag_log_id = @nagLogId
            order by sort_order, id
            """,
            connection);

        command.Parameters.AddWithValue("@nagLogId", nagLogId);

        var nodes = new List<NagNode>();

        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                nodes.Add(new NagNode
                {
                    Id = reader.GetGuid(0),
                    NagLogId = nagLogId,
                    ParentNagNodeId = reader.IsDBNull(1) ? null : reader.GetGuid(1),
                    Name = reader.GetString(2),
                    SortOrder = reader.GetInt32(3)
                });
            }
        }

        foreach (var node in nodes)
        {
            node.NagInputs.AddRange(await GetNagInputsAsync(
                connection,
                nagLogId,
                node.Id,
                cancellationToken));
        }

        return nodes;
    }

    private static async Task<IReadOnlyList<NagInput>> GetNagInputsAsync(
        SqlConnection connection,
        Guid nagLogId,
        Guid parentNagNodeId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select id, label, description, value_type, unit, value, previous_value, sort_order
            from nag_input
            where nag_log_id = @nagLogId
                and parent_nag_node_id = @parentNagNodeId
            order by sort_order, id
            """,
            connection);

        command.Parameters.AddWithValue("@nagLogId", nagLogId);
        command.Parameters.AddWithValue("@parentNagNodeId", parentNagNodeId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var inputs = new List<NagInput>();

        while (await reader.ReadAsync(cancellationToken))
        {
            inputs.Add(new NagInput
            {
                Id = reader.GetGuid(0),
                NagLogId = nagLogId,
                ParentNagNodeId = parentNagNodeId,
                Label = reader.GetString(1),
                Description = reader.IsDBNull(2) ? null : reader.GetString(2),
                ValueType = Enum.Parse<NagInputValueType>(reader.GetString(3)),
                Unit = reader.IsDBNull(4) ? null : reader.GetString(4),
                Value = reader.IsDBNull(5) ? null : reader.GetString(5),
                PreviousValue = reader.IsDBNull(6) ? null : reader.GetString(6),
                SortOrder = reader.GetInt32(7)
            });
        }

        return inputs;
    }

    private static async Task<IReadOnlyList<NagTime>> GetNagTimesAsync(
        SqlConnection connection,
        Guid nagId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select id, time_type, day_of_week, day_of_month, month_of_year
            from nag_time
            where nag_id = @nagId
            order by id
            """,
            connection);

        command.Parameters.AddWithValue("@nagId", nagId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var rules = new List<NagTime>();

        while (await reader.ReadAsync(cancellationToken))
        {
            rules.Add(new NagTime
            {
                Id = reader.GetGuid(0),
                NagId = nagId,
                TimeType = Enum.Parse<NagTimeType>(reader.GetString(1)),
                DayOfWeek = reader.IsDBNull(2)
                    ? null
                    : Enum.Parse<DayOfWeek>(reader.GetString(2)),
                DayOfMonth = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                MonthOfYear = reader.IsDBNull(4) ? null : reader.GetInt32(4)
            });
        }

        return rules;
    }
}
