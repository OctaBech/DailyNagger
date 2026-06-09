namespace DailyNagger.Server.Domain;

public sealed class Nag
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Title { get; init; }
    public DateTimeOffset ScheduleUpdatedAt { get; init; }
    public DateOnly? ActiveLogDueOn { get; init; }
    public DateOnly? ExpiresOn { get; init; }
    public bool IsDeactivated { get; init; }
    public int Version { get; init; }
    public List<NagTime> NagTimes { get; init; } = [];
}

public sealed class NagPlan
{
    public DateOnly Date { get; init; }
    public List<NagPlanNag> Nags { get; init; } = [];
}

public sealed class NagPlanNag
{
    public required Nag Nag { get; init; }
    public required NagLog NagLog { get; init; }
}

public sealed record LapsedNag(
    Guid NagId,
    DateOnly ActiveLogDueOn);

public sealed record CopyLapsedNagLogResult(
    CopyLapsedNagLogStatus Status,
    Guid NagId,
    Guid? OldNagLogId,
    Guid? NewNagLogId,
    DateOnly? ActiveLogDueOn);

public enum CopyLapsedNagLogStatus
{
    Copied,
    Stale,
    NoFutureOccurrence,
    NoOpenLog
}

public sealed class NagTime
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid NagId { get; init; }
    public NagTimeType TimeType { get; init; }
    public DayOfWeek? DayOfWeek { get; init; }
    public int? DayOfMonth { get; init; }
    public int? MonthOfYear { get; init; }
}

public enum NagTimeType
{
    Weekly,
    MonthlyDay,
    YearlyDate
}

public sealed class NagLog
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid NagId { get; init; }
    public Guid? CopiedFromNagLogId { get; init; }
    public DateTimeOffset? ClosedOn { get; init; }
    public DateTimeOffset UpdatedAt { get; init; }
    public int Version { get; init; }
    public List<NagNode> NagNodes { get; init; } = [];
}

public sealed class NagNode
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid NagLogId { get; init; }
    public Guid? ParentNagNodeId { get; init; }
    public required string Name { get; init; }
    public int SortOrder { get; init; }
    public List<NagInput> NagInputs { get; init; } = [];
}

public sealed class NagInput
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid NagLogId { get; init; }
    public Guid ParentNagNodeId { get; init; }
    public required string Label { get; init; }
    public string? Description { get; init; }
    public NagInputValueType ValueType { get; init; }
    public string? Unit { get; init; }
    public string? Value { get; init; }
    public string? PreviousValue { get; init; }
    public int SortOrder { get; init; }
}

public enum NagInputValueType
{
    Text,
    Integer,
    Decimal,
    Boolean
}

public sealed class NagInputUnitSuggestion
{
    public Guid UserId { get; init; }
    public required string Unit { get; init; }
}
