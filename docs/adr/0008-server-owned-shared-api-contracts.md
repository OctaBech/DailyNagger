# ADR 0008: Server Owned Shared API Contracts

## Status

Accepted

## Context

DailyNagger has API DTOs in two worlds:

- C# records in the server project
- TypeScript types in the mobile client

When those drift apart, the app can still compile while the real API contract is
broken. We already saw this with server deserialization failures. That kind of
bug is expensive because it is found at runtime, often on the phone, after the
client has already queued work.

The server is the place where requests are received, deserialized, validated,
and persisted. That makes the server the natural owner of the API contract.

We still want the mobile app to have strong TypeScript types. But those types
should be generated from the server contract instead of being manually copied.

## Decision

DailyNagger will use server-owned OpenAPI contracts for shared client/server
DTOs.

The server C# contracts are the source of truth.

The server exposes an OpenAPI document using the built-in ASP.NET Core OpenAPI
support.

The mobile client uses `openapi-typescript` to generate TypeScript contract
types from that OpenAPI document.

Generated code should be pure contract types. DailyNagger should not generate a
second HTTP client. The handwritten mobile API boundary owns request creation,
headers, observability, error handling, React Query wiring, and app-specific
adaptation.

Generated TypeScript files must not be edited by hand. If the generated code is
wrong, fix the C# contract or the generator configuration.

Hand-written client API boundary code may still exist. Its job is to use the
generated DTOs, not to redefine the server contract.

## Consequences

Client and server contract drift becomes easier to catch.

DTO changes should start in the server contracts and then regenerate TypeScript.

Pull requests and commits can show API contract changes clearly through the C#
contract diff and the generated TypeScript diff.

The first slice should not rewrite every API call. It should add the generation
path and compare generated contracts with the current hand-written mobile DTOs.

Once the generated contracts are stable, mobile imports can be moved over in
small slices.

CI should fail when generated contracts are stale. A server DTO change should be
visible as a C# contract diff and a generated TypeScript contract diff.
