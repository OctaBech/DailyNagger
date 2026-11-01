using DailyNagger.Server.Operations.Demo;
using DailyNagger.Server.Operations.NagPlans;
using DailyNagger.Server.Operations.Nags;
using DailyNagger.Server.Operations.System;
using DailyNagger.Server.Operations.Tags;
using DailyNagger.Server.Operations.TaskLogs;
using DailyNagger.Server.Operations.UserMoods;

namespace DailyNagger.Server.Operations;

public static class OperationsRegistration
{
    public static IServiceCollection AddOperations(this IServiceCollection services)
    {
        services.AddScoped<DemoDataOperations>();
        services.AddScoped<NagOperations>();
        services.AddScoped<NagPlanOperations>();
        services.AddScoped<SystemOperations>();
        services.AddScoped<TagOperations>();
        services.AddScoped<TaskLogOperations>();
        services.AddScoped<UserMoodOperations>();
        services.AddScoped<OperationsFacade>();
        return services;
    }
}
