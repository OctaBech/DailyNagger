# ADR 0007: Required API Correlation Id

## Status

Accepted

## Context

DailyNagger needs client and server logs to describe the same event.

If a client sends an API request without a correlation id, the server can still
invent an id. That makes the request easier to log on the server, but it hides a
more important problem: the client failed to follow the API contract.

That is not useful for the kind of observability we want. When a request fails,
we need to be able to connect the client action, the HTTP request, the server
log, and later MCP or LLM work. A server-generated fallback id only covers the
server side of that story.

## Decision

DailyNagger API requests must include a valid correlation/request id header.

The current header is:

```text
X-DailyNagger-Request-Id
```

The server validates the header at the API boundary.

If the header is missing or invalid, the server rejects the request with
`400 Bad Request`.

If the header is valid, the server normalizes the id and uses it for response
headers, log scopes, error responses, and later trace context.

The server must not silently create a replacement id for normal API requests.
A missing id means the caller is broken.

## Consequences

Client request creation has a hard responsibility: every API request gets a
correlation id before it leaves the app.

Server logs become easier to connect to client logs because both sides agree on
the same id.

Bad clients fail loudly instead of producing half-useful logs.

Tests should cover the boundary behavior: valid id is accepted and echoed;
missing or invalid id is rejected.
