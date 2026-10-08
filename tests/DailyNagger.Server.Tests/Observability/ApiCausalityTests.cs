using DailyNagger.Server.Observability;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using Serilog;
using Serilog.Core;
using Serilog.Events;

namespace DailyNagger.Server.Tests.Observability;

public sealed class ApiCausalityTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Missing_or_empty_key_does_not_create_causality(string? key)
    {
        var context = CreateContext(key);
        Assert.False(ApiCausality.TryGet(context, out _));
    }

    [Fact]
    public void Header_is_case_insensitive_and_requires_one_key_not_multiple_values()
    {
        var context = CreateContext(null);
        context.Request.Headers["DN.CAUSALITY.KEY"] = "action/A";
        Assert.True(ApiCausality.TryGet(context, out var causality));
        Assert.Equal("action/A", causality.Key);

        context.Request.Headers[ApiRequestHeaders.CausalityKey] = new StringValues(["action/A", "action/B"]);
        Assert.False(ApiCausality.TryGet(context, out _));
    }

    [Fact]
    public async Task Middleware_enriches_async_logs_and_errors_without_leaking_to_other_requests()
    {
        var sink = new CollectingSink();
        using var logger = new LoggerConfiguration().Enrich.FromLogContext().WriteTo.Sink(sink).CreateLogger();
        var exception = new InvalidOperationException("Controlled test failure");
        var middleware = new RequireApiRequestIdMiddleware(async context =>
        {
            logger.Information("Before await");
            await Task.Yield();
            logger.Error(exception, "After await");
            if (ApiCausalityContext.TryGet(context, out var causality))
                Assert.Equal(context.Request.Headers[ApiRequestHeaders.CausalityKey].ToString(), causality.Key);
        });

        await middleware.InvokeAsync(CreateContext("action/A"));
        await middleware.InvokeAsync(CreateContext("action/B"));
        await middleware.InvokeAsync(CreateContext(null));
        logger.Information("Outside request");

        Assert.Equal("action/A", Key(sink.Events[0]));
        Assert.Equal("action/A", Key(sink.Events[1]));
        Assert.Same(exception, sink.Events[1].Exception);
        Assert.Equal("action/B", Key(sink.Events[2]));
        Assert.Equal("action/B", Key(sink.Events[3]));
        Assert.Null(Key(sink.Events[4]));
        Assert.Null(Key(sink.Events[5]));
        Assert.Null(Key(sink.Events[6]));
        Assert.All(sink.Events.Take(6), log => Assert.True(log.Properties.ContainsKey(ApiRequestHeaders.RequestId)));
        Assert.False(sink.Events[6].Properties.ContainsKey(ApiRequestHeaders.RequestId));
    }

    private static DefaultHttpContext CreateContext(string? key)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/test";
        context.Request.Headers[ApiRequestHeaders.RequestId] = Guid.NewGuid().ToString("D");
        if (key is not null) context.Request.Headers[ApiRequestHeaders.CausalityKey] = key;
        return context;
    }

    private static object? Key(LogEvent log) =>
        log.Properties.TryGetValue(ApiRequestHeaders.CausalityKey, out var value)
            ? ((ScalarValue)value).Value
            : null;

    private sealed class CollectingSink : ILogEventSink
    {
        public List<LogEvent> Events { get; } = [];
        public void Emit(LogEvent logEvent) => Events.Add(logEvent);
    }
}
