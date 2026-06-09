using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using Microsoft.Extensions.Logging;

namespace DailyNagger.Server.Tests.Operations;

public sealed class NagCopyWorkerTests
{
    [Theory]
    [InlineData(CopyLapsedNagLogStatus.Copied, LogLevel.Information)]
    [InlineData(CopyLapsedNagLogStatus.Stale, LogLevel.Debug)]
    [InlineData(CopyLapsedNagLogStatus.NoFutureOccurrence, LogLevel.Warning)]
    [InlineData(CopyLapsedNagLogStatus.NoOpenLog, LogLevel.Error)]
    public async Task RunAsync_logs_copy_result_status(
        CopyLapsedNagLogStatus status,
        LogLevel expectedLogLevel)
    {
        var command = CreateCommand();
        var logger = new ListLogger<NagCopyWorker>();
        var worker = new NagCopyWorker(
            new FakeCopyHandler(CreateResult(status, command.NagId)),
            logger);

        var result = await worker.RunAsync(command);

        var entry = Assert.Single(logger.Entries);

        Assert.Equal(expectedLogLevel, entry.Level);
        Assert.Contains("NagId", entry.Properties.Keys);
        Assert.Equal(command.NagId, entry.Properties["NagId"]);
        Assert.Equal(status, result.Status);
        Assert.False(result.Failed);
    }

    [Fact]
    public async Task RunAsync_catches_exception_and_logs_failed_result()
    {
        var command = CreateCommand();
        var exception = new InvalidOperationException("copy failed");
        var logger = new ListLogger<NagCopyWorker>();
        var worker = new NagCopyWorker(
            new FakeCopyHandler(exception),
            logger);

        var result = await worker.RunAsync(command);

        var entry = Assert.Single(logger.Entries);

        Assert.Equal(LogLevel.Error, entry.Level);
        Assert.Same(exception, entry.Exception);
        Assert.Contains("Failed to copy lapsed NagLog", entry.Message);
        Assert.Equal(command.NagId, entry.Properties["NagId"]);
        Assert.Equal(command.ExpectedActiveLogDueOn, entry.Properties["ExpectedActiveLogDueOn"]);
        Assert.Null(result.Status);
        Assert.True(result.Failed);
    }

    private static CopyLapsedNagLogCommand CreateCommand() =>
        new(
            Guid.NewGuid(),
            Guid.NewGuid(),
            new DateOnly(2026, 6, 1),
            new DateOnly(2026, 6, 2),
            DateTimeOffset.UtcNow);

    private static CopyLapsedNagLogResult CreateResult(
        CopyLapsedNagLogStatus status,
        Guid nagId) =>
        status switch
        {
            CopyLapsedNagLogStatus.Copied => new CopyLapsedNagLogResult(
                status,
                nagId,
                Guid.NewGuid(),
                Guid.NewGuid(),
                new DateOnly(2026, 6, 8)),
            CopyLapsedNagLogStatus.NoFutureOccurrence => new CopyLapsedNagLogResult(
                status,
                nagId,
                Guid.NewGuid(),
                null,
                null),
            _ => new CopyLapsedNagLogResult(
                status,
                nagId,
                null,
                null,
                null)
        };

    private sealed class FakeCopyHandler : ICopyLapsedNagLogCommandHandler
    {
        private readonly CopyLapsedNagLogResult? result;
        private readonly Exception? exception;

        public FakeCopyHandler(CopyLapsedNagLogResult result)
        {
            this.result = result;
        }

        public FakeCopyHandler(Exception exception)
        {
            this.exception = exception;
        }

        public Task<CopyLapsedNagLogResult> CopyLapsedNagLogAsync(
            Guid communityId,
            Guid nagId,
            DateOnly expectedActiveLogDueOn,
            DateOnly today,
            DateTimeOffset closedOn,
            CancellationToken cancellationToken = default)
        {
            if (exception is not null)
            {
                throw exception;
            }

            return Task.FromResult(result!);
        }
    }

    private sealed class ListLogger<T> : ILogger<T>
    {
        public List<LogEntry> Entries { get; } = [];

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
            var properties = state is IEnumerable<KeyValuePair<string, object?>> values
                ? values
                    .Where(value => value.Key != "{OriginalFormat}")
                    .ToDictionary(value => value.Key, value => value.Value)
                : new Dictionary<string, object?>();

            Entries.Add(new LogEntry(
                logLevel,
                formatter(state, exception),
                exception,
                properties));
        }
    }

    private sealed record LogEntry(
        LogLevel Level,
        string Message,
        Exception? Exception,
        IReadOnlyDictionary<string, object?> Properties);
}
