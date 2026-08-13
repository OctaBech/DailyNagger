# Tree Visitor

Tree visitor walks the task tree and rebuilds the branch it visits.

The task tree is nested:

```text
NagPlan -> Nagger -> TaskLog -> TaskItem -> TaskEntry
```

## Target Facade

Most code should use the `targets` facade instead of calling the visitor files
directly.

The facade lets an operation say:

- start from this tree or this known node
- find this target node
- run these visitor functions on the node types found along the way

The target is usually a stale node-shaped token from UI code. The facade turns
that token into a validated traversal request.

For example, a `TaskEntry` target carries the ids needed to prove where it
belongs:

- nagger id
- task log id
- parent task item id
- task entry id

That makes it harder to accidentally update a matching id in the wrong branch.

## Visitor Functions

A visitor function is called when traversal reaches a node type it cares about.

Each visitor function receives:

- the current node
- `context.isTargetNode`
- `context.isTargetParent`
- `context.path`

Use `context.isTargetNode` when the operation needs to treat the exact requested
node differently.

Use `context.isTargetParent` when the operation needs the nearest parent of the
target. This is powered by `VisitBubble`: the target bubbles a small signal
upward, and the first parent that receives it knows it is the nearest parent.

`context.path` is recorded for memory and selection state. Do not read it later
to figure out parent relationships. If the visitor needs to know a relationship,
make that relationship explicit in context.

## Index Hint

Each node keeps an `indexHint`.

When the visitor searches a child array, it tries the hinted index first. If the
same part of the tree is edited repeatedly, the visitor usually finds the target
without scanning the whole array.

If the hint is wrong, traversal still checks the rest of the array. The hint is a
speed-up, not a correctness requirement.

When a target is found in an array, the parent node stores the successful child
index as its next `indexHint`.

## Identity Guard

In development, the visitor checks that visitor functions do not accidentally
change node identity.

Changing values is fine. Accidentally changing ids or ancestry is not.

If an operation truly needs to replace identity, it must opt in explicitly.
