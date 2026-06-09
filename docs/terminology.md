# Terminology

## Visual Studio

- **Solution Explorer**: the panel in Visual Studio that shows the solution, projects, folders, and files.
- **Solution**: the top-level `.sln` file that groups one or more projects.
- **Project**: a buildable unit, such as the ASP.NET Core API project.
- **Namespace**: the C# naming scope used by types. It often mirrors folders, but it is not the same thing as a folder.

## API Shape

- **DTO**: Data Transfer Object. A type designed to move data across a boundary, such as an HTTP API.
- **Request DTO**: the shape the client sends to the API, for example `SaveNagRequest`.
- **Response DTO**: the shape the API returns to the client, for example `NagPlanDto`.
- **Contract**: the public agreement between client and server. DTOs are part of the API contract.

## Data Layers

- **API contract**: the JSON shape exposed to clients.
- **Domain model**: the business concept in code, such as `Nag` and the `NagLog` copied run structure around it.
- **Persistence model**: the shape used to store data in a database.
- **Database schema**: the actual SQL tables, columns, constraints, and indexes.

These layers often share fields, but they should not automatically be the same type.

## DDD DailyNagger Names

The agreed DDD naming reference lives in `docs/ddd-naming-and-data-structure.md`.

Short version:

- **Nag**: aggregate root for the plan or recurring thing, for example `Gym - Push day`.
- **NagTime**: child entity under `Nag` for time-based rules.
- **NagLog**: aggregate root for one concrete date/run copy of a `Nag`.
- **NagNode**: child entity under `NagLog`, forming a self-referencing node tree.
- **NagInput**: child entity under `NagNode` for concrete user input.

`Task`, `TaskSeries`, and task-table language are not part of the agreed model. `NagContext` is not part of the agreed model. `NagOccurrence` is avoided because `NagLog` already represents the concrete occurrence/copy.
