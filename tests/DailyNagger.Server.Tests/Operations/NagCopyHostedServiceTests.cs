using DailyNagger.Server.Operations;
using Microsoft.Extensions.Logging;

namespace DailyNagger.Server.Tests.Operations;

public sealed class NagCopyHostedServiceTests
{
    [Fact]
    public async Task StartAsync_runs_reconciler_when_enabled()
    {
        var wasCalled = new TaskCompletionSource();
        using var cancellation = new CancellationTokenSource();
        var service = new NagCopyHostedService(
            _ =>
            {
                wasCalled.SetResult();

                return Task.CompletedTask;
            },
            new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
            {
                IsHostedServiceEnabled = true
            }),
            new ListLogger<NagCopyHostedService>());

        await service.StartAsync(cancellation.Token);

        await wasCalled.Task.WaitAsync(TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task StartAsync_does_not_run_reconciler_when_disabled()
    {
        var wasCalled = false;
        using var cancellation = new CancellationTokenSource();
        var service = new NagCopyHostedService(
            _ =>
            {
                wasCalled = true;

                return Task.CompletedTask;
            },
            new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
            {
                IsHostedServiceEnabled = false
            }),
            new ListLogger<NagCopyHostedService>());

        await service.StartAsync(cancellation.Token);

        Assert.False(wasCalled);
    }

    private sealed class ListLogger<T> : ILogger<T>
    {
        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull =>
            null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
        }
    }
}
