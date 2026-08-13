# Tree Operations

Tree operations are the safe public facade for reading and changing the client
task tree.

Use `treeOperations` through its three operation groups:

```ts
const { tree, branch, node } = treeOperations;
```

## Responsibilities

- `tree` reads fresh nodes from memory and replaces nodes from the tree root.
- `branch` changes a target path or multiple related nodes in one operation.
- `node` changes one node without knowing where that node lives in the tree.
- `targets` hides tree-visitor setup and turns a stale node-shaped token into a
  validated traversal target.
- `tree-visitor` is the traversal engine behind the facade.

Use this folder when code needs to read or change the task tree. Use
`@/services/tree-operations/tree-visitor/README.md` before changing the traversal
engine itself.

## Tree Operations

Use `tree` when the operation starts from the current root:

- read a fresh `Nagger`, `TaskLog`, `TaskItem`, or `TaskEntry`
- replace a single node in the current tree

Tree reads take `memory` so the fresh read is part of the operation.

## Branch Operations

Use `branch` when the operation affects a node and its path:

- update done counts when a task item changes done state
- set or clear the selected/focused path

Branch operations return both the new tree and the affected path when memory or
UI state needs to know what was touched.

## Node Operations

Use `node` for local immutable changes:

- set a task entry value
- set a task entry value type
- set a task entry rollover behavior
- close a task log for history
- create a rolled-over task log

Node operations should stay small and composable. Prefer two clear operations
over one combined operation that hides intent.

