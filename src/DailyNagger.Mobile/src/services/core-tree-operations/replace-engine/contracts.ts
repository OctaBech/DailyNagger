import type {
  TraversedNode,
  NagPlanTraversedNode,
  NaggerTraversedNode,
  TaskLogTraversedNode,
  TaskItemTraversedNode,
  TaskEntryTraversedNode,
} from "../traversed-node/contracts";
import type { Guid } from "@/shared";

export type ReplaceContext = {
  readonly action: ReplaceAction;
  readonly path: ReplacePath;
  readonly functions: ReplaceFunctions;
  readonly recordedPath: TraversedNode[];
};

export type ReplaceAction =
  | "replace-all"
  | "replace-nag-plan"
  | "replace-nagger"
  | "replace-task-log"
  | "replace-task-item"
  | "replace-task-entry";

export type ReplacePath = {
  nagId?: Guid;
  taskLogId?: Guid;
  taskItemId?: Guid;
  taskEntryId?: Guid;
};

export type ReplaceNagPlanNodeFn = (nagPlan: NagPlanTraversedNode) => NagPlanTraversedNode;
export type ReplaceNaggerNodeFn = (nagger: NaggerTraversedNode) => NaggerTraversedNode;
export type ReplaceTaskLogNodeFn = (taskLog: TaskLogTraversedNode) => TaskLogTraversedNode;
export type ReplaceTaskItemNodeFn = (taskItem: TaskItemTraversedNode) => TaskItemTraversedNode;
export type ReplaceTaskEntryNodeFn = (taskEntry: TaskEntryTraversedNode) => TaskEntryTraversedNode;

export type ReplaceFunctions = {
  replaceNagPlanNodeFn: ReplaceNagPlanNodeFn;
  replaceNaggerNodeFn: ReplaceNaggerNodeFn;
  replaceTaskLogNodeFn: ReplaceTaskLogNodeFn;
  replaceTaskItemNodeFn: ReplaceTaskItemNodeFn;
  replaceTaskEntryNodeFn: ReplaceTaskEntryNodeFn;
};

// Use found(node) when this branch contains the target or has produced a node
// during replace-all traversal. It does not record the node in replacedPath.
export function found<T extends TraversedNode>(element: T): ReplaceResult<T> {
  return {
    found: true,
    element,
  };
}

// Use notFound(node) when this branch does not contain the target.
export function notFound<T extends TraversedNode>(element: T): ReplaceResult<T> {
  return {
    found: false,
    element,
  };
}

// Records a node in replacedPath and returns it as a found result.
// Use this at the node level that owns the final replacement.
export function recordPath<T extends TraversedNode>(
  context: ReplaceContext,
  element: T,
): ReplaceResult<T> {
  context.recordedPath.push(element);

  return found(element);
}

// Records a result only when a child branch found or produced a replacement.
// Use this when returning from child traversal to the parent node.
export function recordPathIfFound<T extends TraversedNode>(
  context: ReplaceContext,
  result: ReplaceResult<T>,
): ReplaceResult<T> {
  const { found, element } = result;

  if (found) return recordPath(context, element);

  return notFound(element);
}

export type ReplaceResult<T> = {
  readonly found: boolean;
  readonly element: T;
};
