using DailyNagger.Server.Observability;
using Microsoft.AspNetCore.Http;

namespace DailyNagger.Server.Tests.Observability;

public sealed class ApiRequestContextTests
{
    [Fact]
    public void TryGet_returns_false_when_request_id_has_not_been_set()
    {
        var context = new DefaultHttpContext();

        var hasRequestId = ApiRequestContext.TryGet(context, out var requestId);

        Assert.False(hasRequestId);
        Assert.Equal(string.Empty, requestId);
    }

    [Fact]
    public void TryGet_returns_request_id_after_set()
    {
        var context = new DefaultHttpContext();
        var expectedRequestId = Guid.NewGuid().ToString("D");

        ApiRequestContext.Set(context, expectedRequestId);

        var hasRequestId = ApiRequestContext.TryGet(context, out var requestId);

        Assert.True(hasRequestId);
        Assert.Equal(expectedRequestId, requestId);
    }
}
