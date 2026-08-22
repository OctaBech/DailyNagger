# ADR 0009: Observability Identity And Traceability

## Status

Accepted

## Context

DailyNagger needs server and client logs that can be searched and understood without guessing.

We need to see which user, client, device, command, queued parcel, and HTTP request participated in a failure or workflow.

We do not want temporary IDs, fallback IDs, or token values in logs.

## Decision

DailyNagger uses explicit observability fields with separate responsibilities.

Identity fields:

- `userId`: the person/account using the app.
- `clientId`: the app installation.
- `deviceName`: readable device name.
- `deviceModel`: technical device model.
- `platform`: client platform.
- `appVersion`: client version.

Traceability fields:

- `correlationId`: one full workflow from start to finish.
- `commandId`: one command boundary action.
- `parcelId`: one queued send parcel.
- `requestId`: one HTTP request.

HTTP fields:

- `method`
- `path`
- `statusCode`
- `elapsedMs`

Ownership rules:

- The command boundary creates `correlationId`.
- The command boundary creates `commandId`.
- The send queue creates `parcelId`.
- `apiRequest` creates `requestId`.
- Layers may forward IDs they received.
- Layers must not invent IDs they do not own.
- The server validates API headers.
- The server logs accepted fields as structured Serilog properties.
- Secrets and tokens must never be logged.

## Current Implementation

The server requires `X-DailyNagger-Request-Id` on `/api` requests.

`RequireApiRequestIdMiddleware` validates the header, returns it in the response header, stores it in `ApiRequestContext`, and pushes it into Serilog `LogContext`.

`UseSerilogRequestLogging` reads the validated request id from `ApiRequestContext` and writes it as the structured `requestId` property on the HTTP request log.

## Consequences

A single HTTP request can be found by `requestId`.

A full user workflow will be searchable by `correlationId` when command boundaries and send queue carry the full observability contract.

The code must prefer explicit ownership over clever fallback behavior.
