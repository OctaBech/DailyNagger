using System.Net;
using System.Text.Json.Nodes;
using DailyNagger.Server.Observability;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace DailyNagger.Server.Tests.Api.Demo;

// These tests intentionally require no database or Docker fixture.
public sealed class DemoApiGuardTests
{
    [Theory]
    [InlineData("POST")]
    [InlineData("DELETE")]
    public async Task Rejects_empty_target_empty_community_and_unauthenticated_requests(string method)
    {
        using var factory = Factory();
        using var client = Client(factory);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.SendAsync(Request(method, Guid.Empty))).StatusCode);
        client.DefaultRequestHeaders.Authorization = null;
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.SendAsync(Request(method, Guid.NewGuid()))).StatusCode);
        using var disabled = Factory();
        using var disabledClient = Client(disabled);
        Assert.Equal(HttpStatusCode.NotFound, (await disabledClient.SendAsync(Request(method, Guid.NewGuid(), Guid.Empty))).StatusCode);
    }

    [Fact]
    public async Task Published_demo_contract_matches_committed_OpenApi()
    {
        using var factory = Factory();
        using var client = Client(factory);
        var actualText = await client.GetStringAsync("/openapi/v1.json");
        var actual = JsonNode.Parse(actualText)!;
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "src/api-contracts/openapi.json")))
            directory = directory.Parent;
        Assert.NotNull(directory);
        var expectedText = await File.ReadAllTextAsync(Path.Combine(directory.FullName, "src/api-contracts/openapi.json"));
        var expected = JsonNode.Parse(expectedText)!;
        Assert.True(JsonNode.DeepEquals(expected, actual),
            "OpenAPI differs. Demo path: " + actual["paths"]?["/api/demo/data"]?.ToJsonString());
        Assert.Equal(expectedText.ReplaceLineEndings("\n"), actualText.ReplaceLineEndings("\n"));
    }

    private static HttpRequestMessage Request(string method, Guid user, Guid? community = null) =>
        new(new HttpMethod(method), $"/api/demo/data?communityId={community ?? Guid.NewGuid()}&userId={user}");

    private static WebApplicationFactory<Program> Factory() =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Development");
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Sentry:Dsn"] = "",
                    ["DailyNagger:ApiToken"] = "demo-guard-test",
                    ["ConnectionStrings:DailyNaggerControl"] = "Server=localhost;Database=unused",
                    ["ConnectionStrings:DailyNaggerData"] = "Server=localhost;Database=unused"
                }));
        });

    private static HttpClient Client(WebApplicationFactory<Program> factory)
    {
        var client = factory.CreateClient(new() { BaseAddress = new Uri("http://localhost:5010") });
        client.DefaultRequestHeaders.Authorization = new("Bearer", "demo-guard-test");
        client.DefaultRequestHeaders.Add(ApiRequestHeaders.RequestId, Guid.NewGuid().ToString());
        return client;
    }
}
