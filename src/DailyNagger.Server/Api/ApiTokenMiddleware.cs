using System.Net.Http.Headers;

namespace DailyNagger.Server.Api;

public sealed class ApiTokenMiddleware(RequestDelegate next, IConfiguration configuration)
{
    private const string TokenConfigurationKey = "DailyNagger:ApiToken";

    public async Task InvokeAsync(HttpContext context)
    {
        if (IsPublicEndpoint(context.Request.Path))
        {
            await next(context);
            return;
        }

        var expectedToken = configuration[TokenConfigurationKey];

        if (string.IsNullOrWhiteSpace(expectedToken))
        {
            throw new InvalidOperationException($"Missing {TokenConfigurationKey} configuration.");
        }

        if (!HasExpectedBearerToken(context.Request, expectedToken))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }

        await next(context);
    }

    private static bool IsPublicEndpoint(PathString path)
    {
        return path.StartsWithSegments("/api/health", StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasExpectedBearerToken(HttpRequest request, string expectedToken)
    {
        if (!AuthenticationHeaderValue.TryParse(request.Headers.Authorization, out var authorization))
        {
            return false;
        }

        return authorization.Scheme.Equals("Bearer", StringComparison.OrdinalIgnoreCase)
            && string.Equals(authorization.Parameter, expectedToken, StringComparison.Ordinal);
    }
}
