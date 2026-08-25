using System.Net;
using DailyNagger.Server.Observability;
using Microsoft.AspNetCore.Mvc.Testing;

namespace DailyNagger.Server.Tests.Observability;

public sealed class ApiRequestIdMiddlewareTests
{
    [Fact]
    public async Task Api_returns_client_request_id_header()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();
        var requestId = Guid.NewGuid().ToString("D");

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            "/api/health");
        request.Headers.Add(ApiRequestHeaders.RequestId, requestId);

        var response = await client.SendAsync(request);

        Assert.True(response.Headers.TryGetValues(ApiRequestHeaders.RequestId, out var values));
        Assert.Equal(requestId, Assert.Single(values));
    }

    [Fact]
    public async Task Api_rejects_missing_request_id_header()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            "/api/health");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Api_rejects_invalid_request_id_header()
    {
        using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient();

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            "/api/health");
        request.Headers.Add(ApiRequestHeaders.RequestId, "MartinErSmuk");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
