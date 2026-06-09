using System.Text;
using DailyNagger.Server.Contracts;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Scheduling;
using DailyNagger.Server.Validation;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Operations;

public sealed record NagLogWriteResult(
    int Version,
    DateTimeOffset UpdatedAt);

public sealed class DataDbWrite(
    GetDataDbConnection getDataDbConnection,
    NagOccurrenceCalculator occurrenceCalculator)
    : ICopyLapsedNagLogCommandHandler
{
    public async Task<CopyLapsedNagLogResult> CopyLapsedNagLogAsync(
        Guid communityId,
        Guid nagId,
        DateOnly expectedActiveLogDueOn,
        DateOnly today,
        DateTimeOffset closedOn,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        var nag = await GetLapsedNagForUpdateAsync(
            connection,
            transaction,
            nagId,
            expectedActiveLogDueOn,
            today,
            cancellationToken);

        if (nag is null)
        {
            await transaction.RollbackAsync(cancellationToken);

            return new CopyLapsedNagLogResult(
                CopyLapsedNagLogStatus.Stale,
                nagId,
                null,
                null,
                null);
        }

        nag.NagTimes.AddRange(await GetNagTimesAsync(
            connection,
            transaction,
            nag.Id,
            cancellationToken));

        var nextActiveLogDueOn = occurrenceCalculator.GetNextOccurrence(
            nag,
            expectedActiveLogDueOn.AddDays(1));

        var oldNagLog = await GetOpenNagLogForUpdateAsync(
            connection,
            transaction,
            nag.Id,
            cancellationToken);

        if (oldNagLog is null)
        {
            await transaction.RollbackAsync(cancellationToken);

            return new CopyLapsedNagLogResult(
                CopyLapsedNagLogStatus.NoOpenLog,
                nag.Id,
                null,
                null,
                null);
        }

        oldNagLog.NagNodes.AddRange(await GetNagNodesAsync(
            connection,
            transaction,
            oldNagLog.Id,
            cancellationToken));

        await CloseNagLogAsync(
            connection,
            transaction,
            oldNagLog.Id,
            closedOn,
            cancellationToken);

        if (nextActiveLogDueOn is null)
        {
            await UpdateNagActiveLogDueOnAsync(
                connection,
                transaction,
                nag.Id,
                expectedActiveLogDueOn,
                null,
                cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return new CopyLapsedNagLogResult(
                CopyLapsedNagLogStatus.NoFutureOccurrence,
                nag.Id,
                oldNagLog.Id,
                null,
                null);
        }

        var newNagLog = CopyNagLog(
            oldNagLog,
            Guid.NewGuid(),
            closedOn);

        await InsertNagLogAsync(
            connection,
            transaction,
            newNagLog,
            cancellationToken);

        await InsertNagLogTreeAsync(
            connection,
            transaction,
            newNagLog,
            cancellationToken);

        await UpdateNagActiveLogDueOnAsync(
            connection,
            transaction,
            nag.Id,
            expectedActiveLogDueOn,
            nextActiveLogDueOn,
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return new CopyLapsedNagLogResult(
            CopyLapsedNagLogStatus.Copied,
            nag.Id,
            oldNagLog.Id,
            newNagLog.Id,
            nextActiveLogDueOn);
    }

    public async Task<Nag> SaveNagAsync(
        Guid communityId,
        Guid nagId,
        string title,
        DateOnly? expiresOn,
        bool isDeactivated,
        IReadOnlyList<NagTime> nagTimes,
        int? expectedVersion,
        CancellationToken cancellationToken = default)
    {
        var scheduleUpdatedAt = DateTimeOffset.UtcNow;
        var copiedNagTimes = nagTimes
            .Select(rule => new NagTime
            {
                Id = rule.Id,
                NagId = nagId,
                TimeType = rule.TimeType,
                DayOfWeek = rule.DayOfWeek,
                DayOfMonth = rule.DayOfMonth,
                MonthOfYear = rule.MonthOfYear
            })
            .ToList();
        var activeLogDueOn = occurrenceCalculator.GetNextOccurrence(
            new Nag
            {
                Id = nagId,
                Title = title,
                ScheduleUpdatedAt = scheduleUpdatedAt,
                ExpiresOn = expiresOn,
                IsDeactivated = isDeactivated,
                NagTimes = copiedNagTimes
            },
            DateOnly.FromDateTime(scheduleUpdatedAt.UtcDateTime));

        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        var currentVersion = await GetNagVersionAsync(
            connection,
            transaction,
            nagId,
            cancellationToken);

        var version = currentVersion is null
            ? 0
            : expectedVersion.GetValueOrDefault() + 1;

        var nag = new Nag
        {
            Id = nagId,
            Title = title,
            ScheduleUpdatedAt = scheduleUpdatedAt,
            ActiveLogDueOn = activeLogDueOn,
            ExpiresOn = expiresOn,
            IsDeactivated = isDeactivated,
            Version = version,
            NagTimes = copiedNagTimes
        };

        if (currentVersion is null && expectedVersion is not null)
        {
            throw new ConcurrencyConflictException("Nag version conflict.");
        }

        if (currentVersion is not null && expectedVersion is null)
        {
            throw new ConcurrencyConflictException("Nag update requires expectedVersion.");
        }

        await using var command = new SqlCommand(
            currentVersion is not null
                ? """
                  update nag
                  set
                      title = @title,
                      schedule_updated_at = @scheduleUpdatedAt,
                      active_log_due_on = @activeLogDueOn,
                      expires_on = @expiresOn,
                      is_deactivated = @isDeactivated,
                      version = @version
                  where id = @id
                      and version = @expectedVersion
                  """
                : """
                  insert into nag (id, title, schedule_updated_at, active_log_due_on, expires_on, is_deactivated, version)
                  values (@id, @title, @scheduleUpdatedAt, @activeLogDueOn, @expiresOn, @isDeactivated, @version)
                  """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", nag.Id);
        command.Parameters.AddWithValue("@title", nag.Title);
        command.Parameters.AddWithValue("@scheduleUpdatedAt", nag.ScheduleUpdatedAt);
        command.Parameters.AddWithValue("@activeLogDueOn", (object?)nag.ActiveLogDueOn ?? DBNull.Value);
        command.Parameters.AddWithValue("@expiresOn", (object?)nag.ExpiresOn ?? DBNull.Value);
        command.Parameters.AddWithValue("@isDeactivated", nag.IsDeactivated);
        command.Parameters.AddWithValue("@version", nag.Version);
        command.Parameters.AddWithValue("@expectedVersion", (object?)expectedVersion ?? DBNull.Value);

        var changedRows = await command.ExecuteNonQueryAsync(cancellationToken);
        if (changedRows == 0)
        {
            throw new ConcurrencyConflictException("Nag version conflict.");
        }

        await using var deleteNagTimesCommand = new SqlCommand(
            """
            delete from nag_time
            where nag_id = @nagId
            """,
            connection,
            transaction);

        deleteNagTimesCommand.Parameters.AddWithValue("@nagId", nag.Id);

        await deleteNagTimesCommand.ExecuteNonQueryAsync(cancellationToken);

        foreach (var rule in nag.NagTimes)
        {
            await using var ruleCommand = new SqlCommand(
                """
                insert into nag_time
                    (id, nag_id, time_type, day_of_week, day_of_month, month_of_year)
                values
                    (@id, @nagId, @timeType, @dayOfWeek, @dayOfMonth, @monthOfYear)
                """,
                connection,
                transaction);

            ruleCommand.Parameters.AddWithValue("@id", rule.Id);
            ruleCommand.Parameters.AddWithValue("@nagId", nag.Id);
            ruleCommand.Parameters.AddWithValue("@timeType", rule.TimeType.ToString());
            ruleCommand.Parameters.AddWithValue("@dayOfWeek", (object?)rule.DayOfWeek?.ToString() ?? DBNull.Value);
            ruleCommand.Parameters.AddWithValue("@dayOfMonth", (object?)rule.DayOfMonth ?? DBNull.Value);
            ruleCommand.Parameters.AddWithValue("@monthOfYear", (object?)rule.MonthOfYear ?? DBNull.Value);

            await ruleCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);

        return nag;
    }

    public async Task<NagLog> SaveNagLogAsync(
        Guid communityId,
        Guid userId,
        Guid nagLogId,
        Guid nagId,
        Guid? copiedFromNagLogId,
        DateTimeOffset? closedOn,
        int? expectedVersion,
        IReadOnlyList<NagNode> nagNodes,
        CancellationToken cancellationToken = default)
    {
        var copiedNagNodes = nagNodes
            .Select(node => new NagNode
            {
                Id = node.Id,
                NagLogId = nagLogId,
                ParentNagNodeId = node.ParentNagNodeId,
                Name = node.Name,
                SortOrder = node.SortOrder,
                NagInputs = node.NagInputs
                    .Select(input => new NagInput
                    {
                        Id = input.Id,
                        NagLogId = nagLogId,
                        ParentNagNodeId = node.Id,
                        Label = input.Label,
                        Description = input.Description,
                        ValueType = input.ValueType,
                        Unit = input.Unit,
                        Value = input.Value,
                        PreviousValue = null,
                        SortOrder = input.SortOrder
                    })
                    .ToList()
            })
            .ToList();

        var updatedAt = DateTimeOffset.UtcNow;
        var nagLog = new NagLog
        {
            Id = nagLogId,
            NagId = nagId,
            CopiedFromNagLogId = copiedFromNagLogId,
            ClosedOn = closedOn,
            UpdatedAt = updatedAt,
            NagNodes = copiedNagNodes
        };

        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        if (!await NagExistsAsync(connection, transaction, nagLog.NagId, cancellationToken))
        {
            throw new NagValidationException("Nag does not exist.");
        }

        var currentVersion = await GetNagLogVersionAsync(
            connection,
            transaction,
            nagLog.Id,
            cancellationToken);

        var exists = currentVersion is not null;

        if (exists && expectedVersion is null)
        {
            throw new NagValidationException("ExpectedVersion is required when updating an existing NagLog.");
        }

        if (!exists && expectedVersion is not null)
        {
            throw new NagValidationException("ExpectedVersion must be null when creating a new NagLog.");
        }

        var newVersion = exists
            ? expectedVersion!.Value + 1
            : 0;

        nagLog = new NagLog
        {
            Id = nagLog.Id,
            NagId = nagLog.NagId,
            CopiedFromNagLogId = nagLog.CopiedFromNagLogId,
            ClosedOn = nagLog.ClosedOn,
            UpdatedAt = updatedAt,
            Version = newVersion,
            NagNodes = nagLog.NagNodes
        };

        await UpsertNagLogAsync(
            connection,
            transaction,
            nagLog,
            exists,
            expectedVersion,
            cancellationToken);

        await DeleteNagInputsAsync(
            connection,
            transaction,
            nagLog.Id,
            cancellationToken);

        await DeleteNagNodesAsync(
            connection,
            transaction,
            nagLog.Id,
            cancellationToken);

        await InsertNagLogTreeAsync(
            connection,
            transaction,
            nagLog,
            cancellationToken);

        await UpsertNagInputUnitSuggestionsAsync(
            connection,
            transaction,
            userId,
            nagLog.NagNodes
                .SelectMany(node => node.NagInputs)
                .Select(input => input.Unit),
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return nagLog;
    }

    public async Task<NagLogWriteResult> UpdateNagInputValuesAsync(
        Guid communityId,
        Guid nagLogId,
        int expectedVersion,
        IReadOnlyList<NagInputValueUpdateDto> nagInputs,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        var nagLogIsOpen = await NagLogIsOpenAsync(
            connection,
            transaction,
            nagLogId,
            cancellationToken);

        if (!nagLogIsOpen)
        {
            throw new ConcurrencyConflictException("NagLog is closed and cannot accept input updates.");
        }

        var matchingInputCount = await CountNagInputsInNagLogAsync(
            connection,
            transaction,
            nagLogId,
            nagInputs.Select(input => input.Id).ToArray(),
            cancellationToken);

        if (matchingInputCount != nagInputs.Count)
        {
            throw new NagValidationException("All NagInput updates must belong to the requested NagLog.");
        }

        var valueTypes = await GetNagInputValueTypesAsync(
            connection,
            transaction,
            nagInputs.Select(input => input.Id).ToArray(),
            cancellationToken);

        foreach (var input in nagInputs)
        {
            NagRequestValidator.ValidateNagInputValue(
                ToDto(valueTypes[input.Id]),
                input.Value);
        }

        foreach (var input in nagInputs)
        {
            await using var command = new SqlCommand(
                """
                update nag_input
                set value = @value
                where id = @id
                """,
                connection,
                transaction);

            command.Parameters.AddWithValue("@id", input.Id);
            command.Parameters.AddWithValue("@value", (object?)input.Value ?? DBNull.Value);

            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        var updatedAt = DateTimeOffset.UtcNow;
        var newVersion = await IncrementNagLogVersionAsync(
            connection,
            transaction,
            nagLogId,
            expectedVersion,
            updatedAt,
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return new NagLogWriteResult(
            newVersion,
            updatedAt);
    }

    private static async Task<bool> NagLogIsOpenAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagLogId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select count(*)
            from nag_log
            where id = @nagLogId
                and closed_on is null
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@nagLogId", nagLogId);

        return (int)await command.ExecuteScalarAsync(cancellationToken) == 1;
    }

    private static async Task<Nag?> GetLapsedNagForUpdateAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagId,
        DateOnly expectedActiveLogDueOn,
        DateOnly today,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select
                id,
                title,
                schedule_updated_at,
                expires_on
            from nag with (updlock, rowlock)
            where id = @nagId
                and is_deactivated = 0
                and active_log_due_on = @expectedActiveLogDueOn
                and active_log_due_on < @today
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@nagId", nagId);
        command.Parameters.AddWithValue("@expectedActiveLogDueOn", expectedActiveLogDueOn);
        command.Parameters.AddWithValue("@today", today);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new Nag
        {
            Id = reader.GetGuid(0),
            Title = reader.GetString(1),
            ScheduleUpdatedAt = reader.GetDateTimeOffset(2),
            ActiveLogDueOn = expectedActiveLogDueOn,
            ExpiresOn = reader.IsDBNull(3)
                ? null
                : DateOnly.FromDateTime(reader.GetDateTime(3)),
            IsDeactivated = false
        };
    }

    private static async Task<NagLog?> GetOpenNagLogForUpdateAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select top (1)
                id,
                copied_from_nag_log_id,
                updated_at
            from nag_log with (updlock, rowlock)
            where nag_id = @nagId
                and closed_on is null
            order by id
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@nagId", nagId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new NagLog
        {
            Id = reader.GetGuid(0),
            NagId = nagId,
            CopiedFromNagLogId = reader.IsDBNull(1) ? null : reader.GetGuid(1),
            UpdatedAt = reader.GetDateTimeOffset(2)
        };
    }

    private static async Task<IReadOnlyList<NagTime>> GetNagTimesAsync(
        SqlConnection connection,
        SqlTransaction transaction,
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
            connection,
            transaction);

        command.Parameters.AddWithValue("@nagId", nagId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var nagTimes = new List<NagTime>();

        while (await reader.ReadAsync(cancellationToken))
        {
            nagTimes.Add(new NagTime
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

        return nagTimes;
    }

    private static async Task<IReadOnlyList<NagNode>> GetNagNodesAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagLogId,
        CancellationToken cancellationToken)
    {
        await using var nodeCommand = new SqlCommand(
            """
            select id, parent_nag_node_id, name, sort_order
            from nag_node
            where nag_log_id = @nagLogId
            order by sort_order, id
            """,
            connection,
            transaction);

        nodeCommand.Parameters.AddWithValue("@nagLogId", nagLogId);

        var nodes = new List<NagNode>();

        await using (var reader = await nodeCommand.ExecuteReaderAsync(cancellationToken))
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

        await using var inputCommand = new SqlCommand(
            """
            select id, parent_nag_node_id, label, description, value_type, unit, value, previous_value, sort_order
            from nag_input
            where nag_log_id = @nagLogId
            order by sort_order, id
            """,
            connection,
            transaction);

        inputCommand.Parameters.AddWithValue("@nagLogId", nagLogId);

        await using (var reader = await inputCommand.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                var parentNagNodeId = reader.GetGuid(1);
                var parent = nodes.Single(node => node.Id == parentNagNodeId);

                parent.NagInputs.Add(new NagInput
                {
                    Id = reader.GetGuid(0),
                    NagLogId = nagLogId,
                    ParentNagNodeId = parentNagNodeId,
                    Label = reader.GetString(2),
                    Description = reader.IsDBNull(3) ? null : reader.GetString(3),
                    ValueType = Enum.Parse<NagInputValueType>(reader.GetString(4)),
                    Unit = reader.IsDBNull(5) ? null : reader.GetString(5),
                    Value = reader.IsDBNull(6) ? null : reader.GetString(6),
                    PreviousValue = reader.IsDBNull(7) ? null : reader.GetString(7),
                    SortOrder = reader.GetInt32(8)
                });
            }
        }

        return nodes;
    }

    private static NagLog CopyNagLog(
        NagLog source,
        Guid newNagLogId,
        DateTimeOffset updatedAt)
    {
        var nodeIdMap = source.NagNodes.ToDictionary(
            node => node.Id,
            _ => Guid.NewGuid());

        return new NagLog
        {
            Id = newNagLogId,
            NagId = source.NagId,
            CopiedFromNagLogId = source.Id,
            ClosedOn = null,
            UpdatedAt = updatedAt,
            NagNodes = source.NagNodes
                .Select(node => new NagNode
                {
                    Id = nodeIdMap[node.Id],
                    NagLogId = newNagLogId,
                    ParentNagNodeId = node.ParentNagNodeId is null
                        ? null
                        : nodeIdMap[node.ParentNagNodeId.Value],
                    Name = node.Name,
                    SortOrder = node.SortOrder,
                    NagInputs = node.NagInputs
                        .Select(input => new NagInput
                        {
                            Id = Guid.NewGuid(),
                            NagLogId = newNagLogId,
                            ParentNagNodeId = nodeIdMap[input.ParentNagNodeId],
                            Label = input.Label,
                            Description = input.Description,
                            ValueType = input.ValueType,
                            Unit = input.Unit,
                            Value = null,
                            PreviousValue = input.Value,
                            SortOrder = input.SortOrder
                        })
                        .ToList()
                })
                .ToList()
        };
    }

    private static async Task UpsertNagLogAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        NagLog nagLog,
        bool exists,
        int? expectedVersion,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            exists
                ? """
                  update nag_log
                  set
                      nag_id = @nagId,
                      copied_from_nag_log_id = @copiedFromNagLogId,
                      closed_on = @closedOn,
                      updated_at = @updatedAt,
                      version = @version
                  where id = @id
                      and version = @expectedVersion
                  """
                : """
                  insert into nag_log (id, nag_id, copied_from_nag_log_id, closed_on, updated_at, version)
                  values (@id, @nagId, @copiedFromNagLogId, @closedOn, @updatedAt, @version)
                  """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", nagLog.Id);
        command.Parameters.AddWithValue("@nagId", nagLog.NagId);
        command.Parameters.AddWithValue("@copiedFromNagLogId", (object?)nagLog.CopiedFromNagLogId ?? DBNull.Value);
        command.Parameters.AddWithValue("@closedOn", (object?)nagLog.ClosedOn ?? DBNull.Value);
        command.Parameters.AddWithValue("@updatedAt", nagLog.UpdatedAt);
        command.Parameters.AddWithValue("@version", nagLog.Version);

        if (exists)
        {
            command.Parameters.AddWithValue("@expectedVersion", expectedVersion);
        }

        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);

        if (affectedRows == 0)
        {
            throw new ConcurrencyConflictException("NagLog version conflict.");
        }
    }

    private static Task InsertNagLogAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        NagLog nagLog,
        CancellationToken cancellationToken) =>
        UpsertNagLogAsync(
            connection,
            transaction,
            nagLog,
            exists: false,
            expectedVersion: null,
            cancellationToken);

    private static async Task InsertNagLogTreeAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        NagLog nagLog,
        CancellationToken cancellationToken)
    {
        await InsertNagNodesAsync(
            connection,
            transaction,
            nagLog.NagNodes,
            cancellationToken);

        await InsertNagInputsAsync(
            connection,
            transaction,
            nagLog.NagNodes.SelectMany(node => node.NagInputs).ToArray(),
            cancellationToken);
    }

    private static async Task InsertNagNodesAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        IReadOnlyList<NagNode> nagNodes,
        CancellationToken cancellationToken)
    {
        if (nagNodes.Count == 0)
        {
            return;
        }

        var sql = new StringBuilder("""
            insert into nag_node
                (id, nag_log_id, parent_nag_node_id, name, sort_order)
            values
            """);

        await using var command = new SqlCommand
        {
            Connection = connection,
            Transaction = transaction
        };

        for (var i = 0; i < nagNodes.Count; i++)
        {
            if (i > 0)
            {
                sql.AppendLine(",");
            }

            sql.Append($"(@nodeId{i}, @nodeNagLogId{i}, @nodeParentNagNodeId{i}, @nodeName{i}, @nodeSortOrder{i})");

            command.Parameters.AddWithValue($"@nodeId{i}", nagNodes[i].Id);
            command.Parameters.AddWithValue($"@nodeNagLogId{i}", nagNodes[i].NagLogId);
            command.Parameters.AddWithValue($"@nodeParentNagNodeId{i}", (object?)nagNodes[i].ParentNagNodeId ?? DBNull.Value);
            command.Parameters.AddWithValue($"@nodeName{i}", nagNodes[i].Name);
            command.Parameters.AddWithValue($"@nodeSortOrder{i}", nagNodes[i].SortOrder);
        }

        command.CommandText = sql.ToString();

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task InsertNagInputsAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        IReadOnlyList<NagInput> nagInputs,
        CancellationToken cancellationToken)
    {
        if (nagInputs.Count == 0)
        {
            return;
        }

        var sql = new StringBuilder("""
            insert into nag_input
                (id, nag_log_id, parent_nag_node_id, label, description, value_type, unit, value, previous_value, sort_order)
            values
            """);

        await using var command = new SqlCommand
        {
            Connection = connection,
            Transaction = transaction
        };

        for (var i = 0; i < nagInputs.Count; i++)
        {
            if (i > 0)
            {
                sql.AppendLine(",");
            }

            sql.Append(
                $"(@inputId{i}, @inputNagLogId{i}, @inputParentNagNodeId{i}, @inputLabel{i}, @inputDescription{i}, @inputValueType{i}, @inputUnit{i}, @inputValue{i}, @inputPreviousValue{i}, @inputSortOrder{i})");

            command.Parameters.AddWithValue($"@inputId{i}", nagInputs[i].Id);
            command.Parameters.AddWithValue($"@inputNagLogId{i}", nagInputs[i].NagLogId);
            command.Parameters.AddWithValue($"@inputParentNagNodeId{i}", nagInputs[i].ParentNagNodeId);
            command.Parameters.AddWithValue($"@inputLabel{i}", nagInputs[i].Label);
            command.Parameters.AddWithValue($"@inputDescription{i}", (object?)nagInputs[i].Description ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputValueType{i}", nagInputs[i].ValueType.ToString());
            command.Parameters.AddWithValue($"@inputUnit{i}", (object?)nagInputs[i].Unit ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputValue{i}", (object?)nagInputs[i].Value ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputPreviousValue{i}", (object?)nagInputs[i].PreviousValue ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputSortOrder{i}", nagInputs[i].SortOrder);
        }

        command.CommandText = sql.ToString();

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task CloseNagLogAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagLogId,
        DateTimeOffset closedOn,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            update nag_log
            set
                closed_on = @closedOn,
                updated_at = @closedOn
            where id = @nagLogId
                and closed_on is null
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@nagLogId", nagLogId);
        command.Parameters.AddWithValue("@closedOn", closedOn);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task UpdateNagActiveLogDueOnAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagId,
        DateOnly expectedActiveLogDueOn,
        DateOnly? newActiveLogDueOn,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            update nag
            set
                active_log_due_on = @newActiveLogDueOn,
                version = version + 1
            where id = @nagId
                and active_log_due_on = @expectedActiveLogDueOn
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@nagId", nagId);
        command.Parameters.AddWithValue("@expectedActiveLogDueOn", expectedActiveLogDueOn);
        command.Parameters.AddWithValue("@newActiveLogDueOn", (object?)newActiveLogDueOn ?? DBNull.Value);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task<int> CountNagInputsInNagLogAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagLogId,
        IReadOnlyList<Guid> nagInputIds,
        CancellationToken cancellationToken)
    {
        var parameterNames = nagInputIds
            .Select((_, index) => $"@inputId{index}")
            .ToArray();

        await using var command = new SqlCommand(
            $"""
            select count(*)
            from nag_input
            where nag_input.nag_log_id = @nagLogId
                and nag_input.id in ({string.Join(", ", parameterNames)})
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@nagLogId", nagLogId);

        for (var i = 0; i < nagInputIds.Count; i++)
        {
            command.Parameters.AddWithValue(parameterNames[i], nagInputIds[i]);
        }

        return (int)await command.ExecuteScalarAsync(cancellationToken);
    }

    private static async Task<Dictionary<Guid, NagInputValueType>> GetNagInputValueTypesAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        IReadOnlyList<Guid> nagInputIds,
        CancellationToken cancellationToken)
    {
        var parameterNames = nagInputIds
            .Select((_, index) => $"@inputId{index}")
            .ToArray();

        await using var command = new SqlCommand(
            $"""
            select id, value_type
            from nag_input
            where id in ({string.Join(", ", parameterNames)})
            """,
            connection,
            transaction);

        for (var i = 0; i < nagInputIds.Count; i++)
        {
            command.Parameters.AddWithValue(parameterNames[i], nagInputIds[i]);
        }

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var valueTypes = new Dictionary<Guid, NagInputValueType>();

        while (await reader.ReadAsync(cancellationToken))
        {
            valueTypes.Add(
                reader.GetGuid(0),
                Enum.Parse<NagInputValueType>(reader.GetString(1)));
        }

        return valueTypes;
    }

    private static NagInputValueTypeDto ToDto(NagInputValueType valueType) =>
        valueType switch
        {
            NagInputValueType.Text => NagInputValueTypeDto.Text,
            NagInputValueType.Integer => NagInputValueTypeDto.Integer,
            NagInputValueType.Decimal => NagInputValueTypeDto.Decimal,
            NagInputValueType.Boolean => NagInputValueTypeDto.Boolean,
            _ => throw new ArgumentOutOfRangeException(nameof(valueType), valueType, null)
        };

    private static async Task UpsertNagInputUnitSuggestionsAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid userId,
        IEnumerable<string?> units,
        CancellationToken cancellationToken)
    {
        foreach (var unit in units
            .Where(unit => !string.IsNullOrWhiteSpace(unit))
            .Select(unit => unit!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            await using var command = new SqlCommand(
                """
                insert into nag_input_unit_suggestion (user_id, unit)
                select @userId, @unit
                where not exists (
                    select 1
                    from nag_input_unit_suggestion
                    where user_id = @userId
                        and unit = @unit
                )
                """,
                connection,
                transaction);

            command.Parameters.AddWithValue("@userId", userId);
            command.Parameters.AddWithValue("@unit", unit);

            await command.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    private static async Task DeleteNagInputsAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagLogId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            delete nag_input
            from nag_input
            where nag_input.nag_log_id = @nagLogId
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@nagLogId", nagLogId);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task DeleteNagNodesAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagLogId,
        CancellationToken cancellationToken)
    {
        while (true)
        {
            await using var command = new SqlCommand(
                """
                delete from nag_node
                where nag_log_id = @nagLogId
                    and not exists (
                        select 1
                        from nag_node child
                        where child.parent_nag_node_id = nag_node.id
                    )
                """,
                connection,
                transaction);

            command.Parameters.AddWithValue("@nagLogId", nagLogId);

            var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);

            if (affectedRows == 0)
            {
                return;
            }
        }
    }

    private static async Task<bool> NagExistsAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select 1
            from nag
            where id = @id
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", nagId);

        return await command.ExecuteScalarAsync(cancellationToken) is not null;
    }

    private static async Task<int?> GetNagVersionAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select version
            from nag
            where id = @id
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", nagId);

        var result = await command.ExecuteScalarAsync(cancellationToken);

        return result is null ? null : (int)result;
    }

    private static async Task<int?> GetNagLogVersionAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagLogId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select version
            from nag_log
            where id = @id
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", nagLogId);

        var result = await command.ExecuteScalarAsync(cancellationToken);

        return result is null ? null : (int)result;
    }

    private static async Task<int> IncrementNagLogVersionAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagLogId,
        int expectedVersion,
        DateTimeOffset updatedAt,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            update nag_log
            set
                version = version + 1,
                updated_at = @updatedAt
            output inserted.version
            where id = @id
                and version = @expectedVersion
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", nagLogId);
        command.Parameters.AddWithValue("@expectedVersion", expectedVersion);
        command.Parameters.AddWithValue("@updatedAt", updatedAt);

        var result = await command.ExecuteScalarAsync(cancellationToken);

        if (result is null)
        {
            throw new ConcurrencyConflictException("NagLog version conflict.");
        }

        return (int)result;
    }
}
