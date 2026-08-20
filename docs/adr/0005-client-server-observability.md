# ADR 0005: Client And Server Observability

## Status

Accepted

## Context

DailyNagger is moving toward MCP and assistant-driven workflows.

That means a single user action may eventually travel through the mobile app,
the server, an MCP layer, and an LLM provider. When something fails, we need to
see the path the action took. Guessing from screenshots and generic 500 errors
is not good enough.

We also want this work to teach real observability practices. A small homemade
client logger would be faster today, but it would not teach the tools and
concepts used in production systems.

The client and server have different strengths:

- Expo React Native has mature Sentry support for mobile errors, crashes,
  breadcrumbs, and client-side logs.
- .NET servers are a strong fit for Serilog and OpenTelemetry.
- OpenTelemetry directly inside React Native is still more fragile than it is on
  the server.

## Decision

DailyNagger will use a hybrid observability setup.

The mobile client will use Sentry for Expo/React Native.

The server will use Serilog and OpenTelemetry.

Client API calls should carry correlation data to the server. At minimum, the
client should create a request id for each API call and send it in a header. The
server should log that id and include it in the request context.

When distributed tracing is added, the client and server should use standard
trace context headers where possible instead of inventing a DailyNagger-only
trace format.

The app should not build a parallel homemade logging framework first. Thin
wrappers around Sentry, Serilog, or OpenTelemetry are allowed when they keep
DailyNagger code tidy, but the underlying observability model should come from
real tools.

## Consequences

Client observability starts with production-grade mobile tooling instead of a
custom console logger.

Server observability can stay vendor-neutral through OpenTelemetry while still
using Serilog for practical structured logging.

The first useful traceability slice is not dashboards. It is being able to match
one client API request with the server logs that handled it.

Later MCP work should reuse the same request and trace context. MCP calls should
not become a separate invisible path through the system.

If Sentry, Serilog, or OpenTelemetry require setup code, that setup belongs near
the app/server boundaries. Feature code should not know which dashboard receives
the telemetry.
