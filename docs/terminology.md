# Terminology

## Visual Studio

- **Solution Explorer**: the panel in Visual Studio that shows the solution, projects, folders, and files.
- **Solution**: the top-level `.sln` file that groups one or more projects.
- **Project**: a buildable unit, such as the ASP.NET Core API project.
- **Namespace**: the C# naming scope used by types. It often mirrors folders, but it is not the same thing as a folder.

## API Shape

- **DTO**: Data Transfer Object. A type designed to move data across a boundary, such as an HTTP API.
- **Request DTO**: the shape the client sends to the API, for example `CreateTaskRequest`.
- **Response DTO**: the shape the API returns to the client, for example `TaskSummaryDto`.
- **Contract**: the public agreement between client and server. DTOs are part of the API contract.

## Data Layers

- **API contract**: the JSON shape exposed to clients.
- **Domain model**: the business concept in code, such as a task and the rules around it.
- **Persistence model**: the shape used to store data in a database.
- **Database schema**: the actual SQL tables, columns, constraints, and indexes.

These layers often share fields, but they should not automatically be the same type.
