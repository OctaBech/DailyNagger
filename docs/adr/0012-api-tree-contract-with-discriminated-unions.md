# ADR 0012: API Tree Contract With Discriminated Unions

## Status

Accepted

## Context

DailyNagger's task tree currently has two separate child collections:

- `taskItems`
- `taskEntries`

That was simple at the beginning, but it no longer matches how the app should
be used.

The product need is that different kinds of task nodes must be able to appear
in the same working order. A note or value field can belong between two
checkmarks. It should not be forced into a separate group just because it is a
different technical type.

For example, a gym routine may need:

```txt
checkbox: Warm up
note: Seat height 4
checkbox: Working set
value: Weight used last time
checkbox: Stretch
```

If the API keeps `taskItems` and `taskEntries` as separate arrays, then several
parts of the system have to understand how to split, merge, sort, and display
the same tree:

- server DTO mapping
- mobile model conversion
- UI rendering
- tree operations
- action code

That spreads ownership of one structural rule across the codebase. It also
makes future features, such as moving notes between checkmarks, harder than
they need to be.

DailyNagger already has a server-owned API contract. The server is the DTO
owner because it receives, validates, persists, and returns the shared contract.
The owner of the DTO shape should also be the only place that knows how to
assemble and disassemble the API tree shape.

## Decision

DailyNagger will move the API task tree contract toward a nested recursive
tree with discriminated unions.

Task parents should expose one ordered child collection:

```ts
children: TaskChild[]
```

where:

```ts
TaskChild = TaskItem | TaskEntry;
```

Each child carries a `nodeType` field. That field is the discriminant that lets
the client and generated TypeScript types tell which concrete shape an element
has.

Example shape:

```json
{
  "nodeType": "TaskItem",
  "id": "...",
  "name": "Working set",
  "children": [
    {
      "nodeType": "TaskEntry",
      "id": "...",
      "label": "Seat height",
      "value": "4"
    }
  ]
}
```

This follows common best practice for arrays containing mixed node types: every
element carries its own type marker, and callers do not have to guess the type
from which properties happen to exist.

The API should expose the tree in the shape the client actually works with.
The server may still persist task items and task entries in separate relational
tables. That is a storage concern. The API contract should describe the working
tree.

## OpenAPI

The preferred contract is a real discriminated union using `nodeType`.

We are aware that polymorphic DTOs can be more demanding for OpenAPI and
TypeScript generation than simple DTO arrays. DailyNagger should try the clean
OpenAPI representation first because it gives the best client model:

```ts
TaskChildDto = TaskItemDto | TaskEntryDto;
```

If the OpenAPI or TypeScript generator output becomes too awkward, we should
stop and reassess before accepting a wrapper DTO or a flattened model. Tooling
friction is real, but it should not silently move tree assembly rules into the
client.

Wrapper DTOs are not forbidden, but they are not the preferred model. They add
contract noise and can allow invalid shapes such as "both item and entry are
set" unless validation closes the gap. The clean discriminated union better
matches the domain and keeps the API honest.

## Consequences

Task ordering becomes one concept instead of two parallel concepts.

Moving a child node becomes simpler because a parent has one ordered child
collection.

UI rendering can become simpler because a parent renders `children` in order
instead of rendering entries and items as separate groups.

Server mapping becomes the explicit boundary between relational persistence
and the nested API tree. On output, the server assembles `children` from stored
task items and task entries. On input, the server splits `children` back into
domain objects and assigns `SortOrder` from the child array position.

Existing data may initially contain duplicate `SortOrder` values across task
items and task entries under the same parent. That is acceptable for this
personal project. The server should still return a deterministic order, and
future saves can normalize the order by writing array indexes back as
`SortOrder`.

The change should be implemented in small slices:

1. Spike the server contract and generated TypeScript output.
2. Change server DTO mapping if OpenAPI output is usable.
3. Regenerate API contracts.
4. Update mobile model conversion.
5. Update mobile tree operations and UI rendering.
6. Remove old `taskItems` / `taskEntries` assumptions where they are no longer
   needed.

The goal is not to make the database look like the UI. The goal is to make the
API contract express the tree shape that DailyNagger actually uses.
