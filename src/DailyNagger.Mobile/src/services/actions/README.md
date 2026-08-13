# Actions

Actions contain the actual behavior scripts.

They should be written so a reader can follow the work from fresh state to final
memory write without also understanding React hooks, screen components, or
dispatch plumbing.

## Script Style

Actions should read like short scripts:

1. read fresh state
2. apply one small operation at a time
3. replace the changed node or branch
4. write memory
5. queue server work when needed

Prefer linear `V1..n` names for intermediate values:

```ts
const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);

const taskEntryV1 = node.setTaskEntryValueType(freshTaskEntry, valueType);
const taskEntryV2 = node.setTaskEntryRolloverBehavior(taskEntryV1, rolloverBehavior);

const newTree = tree.replaceTaskEntry(freshTree, taskEntryV2);

memory.write.setTree(newTree);
```

The operation name explains what changed. The `V1..n` suffix explains sequence.

## Stale Node Tokens

Nodes passed into actions from JSX are tokens, not trusted current data. They
identify which fresh node to read from memory. Event order, rerenders, and queued
state changes can make the JSX node stale before the action runs.

Read fresh state before mutating.

## No Branching Mutation Chains

Do not branch intermediate mutation chains in actions. A reader should be able to
follow the main value from `freshNode` through `V1`, `V2`, `V3`, and into the
final write.

Choose values before the mutation chain starts:

```ts
const rolloverBehavior = shouldKeepValue ? "CarryOverValue" : "MoveValueToHistory";
const taskEntryV1 = node.setTaskEntryRolloverBehavior(freshTaskEntry, rolloverBehavior);
```

Do not create parallel versions such as `taskEntryForHistory`,
`taskEntryForCarryOver`, and `taskEntryForServer` in the same action.

## Small Operations

Prefer small composable operations:

```ts
node.setTaskEntryValueType(...)
node.setTaskEntryRolloverBehavior(...)
```

over a combined operation such as:

```ts
node.setTaskEntryValueTypeAndRolloverBehavior(...)
```

Keep operations separate.
