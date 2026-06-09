using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DailyNagger.Server.Operations;

public sealed class NagCopyHostedService(
    Func<CancellationToken, Task> runReconcilerAsync,
    IOptionsMonitor<NagCopyWorkerOptions> optionsMonitor,
    ILogger<NagCopyHostedService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!optionsMonitor.CurrentValue.IsHostedServiceEnabled)
        {
            logger.LogInformation("Nag copy hosted service is disabled.");

            return;
        }

        await runReconcilerAsync(stoppingToken);
    }
}
