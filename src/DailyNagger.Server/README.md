# DailyNagger.Server

An ASP.NET Core Minimal API for DailyNagger's Android client. The client owns
application state and much of the application behavior. The server persists that
state and checks requests, write versions, and database relationships.

## Start here

- `Program.cs` composes the application and orders the HTTP middleware.
- `Api` defines the endpoints and translates results and exceptions into HTTP responses.
- `OperationsFacade` provides access to the application operations.
- `DatabaseQueries` and `DatabaseCommands` provide access to database reads and writes.

For example, a task-log write enters through `Api/TaskLogs`, is validated by
`RequestValidator`, and calls `OperationsFacade.TaskLogs`. The operation maps the
request and invokes `DatabaseCommands.TaskLogs`; the database write owns its
connection and transaction. Mapping converts the result back to the response DTO.

### Why facades?

`OperationsFacade`, `DatabaseQueries`, and `DatabaseCommands` provide a single,
discoverable entry point through IntelliSense at each boundary. This intentionally
broadens dependencies and causes DI to construct services that a particular call
may not use. Child services do not depend on their own facade.

## Folder responsibilities

| Folder | Responsibility |
| --- | --- |
| `Api` | Endpoint definitions, request parsing, validation calls, and HTTP responses. `SystemApi` describes the server as a whole rather than one application resource. |
| `Contracts` | API request/response DTOs, grouped by area. `VersionedRequest` and `ClientIdentityDto` are shared contracts, not endpoints. |
| `ApiDocumentation` | OpenAPI schema customization. The generated document is consumed by the separate `src/api-contracts` package to generate TypeScript types. This folder owns neither endpoint definitions nor DTOs. |
| `Operations` | Application entry points behind `OperationsFacade`, including request-to-model and model-to-response mapping calls. No HTTP response construction or database implementation details. |
| `Mapping` | Shared, concrete conversions between domain models and contracts. Each conversion has one owner. Tags and moods already return DTO projections from database calls and need no additional mapper. |
| `Domain/Tenant` | Shared internal models for tasks, logs, plans, tags, and moods. Several are also used as EF entities. |
| `Domain/Control` | Community routing, membership, user-profile, and debug-target models. |
| `Domain/Exceptions` | Shared rejection/conflict signals. The API, not these exceptions, chooses the HTTP response. |
| `Database` | Persistence implementation, described below. |
| `Validation` | Request-contract checks, with shared metadata, schedule-rule, and task-tree checks. `RequestValidator` is the common entry point. Its placement is separate from the ownership of the shared exceptions. |
| `Observability` | Request identifiers, causal context, and tracing-related middleware. |
| `Security` | API-token access checks. |
| `Deployment` | Server-side deployment tooling, including the Caddy route exporter. The repository's workflows and deployment runbooks live outside this project. |
| `Properties` | Local launch/debug profiles. |

`Nag` is the API resource name; `Nagger` is its internal model. A `NagPlan`
combines naggers with their task logs for presentation.

## Database navigation

- `Queries/<area>` contains reads; `Commands/<area>` contains writes.
- `*Read` and `*Write` classes perform database workflows and manage connection
  lifetime. Writes also own their transaction where one is needed.
- Larger workflows delegate SQL details to `*Queries`, `*Commands`, or tree-write
  helpers. Helpers participate in the caller's existing connection/transaction.
- Small reads and writes keep their SQL in the area class rather than adding an
  otherwise unnecessary forwarding layer.
- The root query/command facades group access to these classes. They are not
  database models or DI registration classes.
- `DatabaseRegistration` registers the implementations with the DI container.
- `Contexts/Control` and `Contexts/Tenant` map domain models to tables, columns,
  keys, and relationships. `Migrations` keeps their separate schema histories.
- `Connections` resolves and opens the appropriate community/tenant connection.

Moving files or changing their organization must not silently change the schema,
transaction boundaries, accepted payloads, or validation rules.

## Tests

The separate `tests/DailyNagger.Server.Tests` project follows production areas
where the relationship is direct. Broad database integration tests have their own
group. `TestUtilities` contains shared fixtures and helpers, not test cases.
The broad API suite remains at its existing path, also used by a published case.
