namespace DailyNagger.Server.Domain.Tenant;

public enum RolloverBehavior
{
    Keep,
    Remove,
    RemoveWhenDone,
    MoveValueToHistory,
    CarryOverValue
}
