import type { Guid } from "@/shared";
import type {
  NagPlanTraversedNode,
  NaggerTraversedNode,
  TaskEntryTraversedNode,
  TaskItemTraversedNode,
  TaskLogTraversedNode,
  TraversedNode,
} from "../../core-tree-operations/traversed-node/contracts";

export type NaggerTarget = {
  readonly kind: "nagger";
  readonly id: Guid;
};

export type TaskLogTarget = {
  readonly kind: "task-log";
  readonly id: Guid;
  readonly requiredAncestry: {
    readonly naggerId: Guid;
  };
};

export type TaskItemTarget = {
  readonly kind: "task-item";
  readonly id: Guid;
  readonly requiredAncestry: {
    readonly naggerId: Guid;
    readonly taskLogId: Guid;
    readonly parentTaskItemId: Guid | null;
  };
};

export type TaskEntryTarget = {
  readonly kind: "task-entry";
  readonly id: Guid;
  readonly requiredAncestry: {
    readonly naggerId: Guid;
    readonly taskLogId: Guid;
    readonly taskItemId: Guid;
  };
};

export type TreeTarget = NaggerTarget | TaskEntryTarget | TaskItemTarget | TaskLogTarget;

export type VisitRequest =
  | {
      readonly kind: "all";
    }
  | {
      readonly kind: "target";
      readonly target: TreeTarget;
    };

export type VisitContext = {
  readonly isTargetNode: boolean;
  readonly isTargetParent: boolean;
  readonly path: readonly TraversedNode[];
};

export type TreeVisitor = {
  readonly visitNagPlan?: (
    nagPlan: NagPlanTraversedNode,
    context: VisitContext,
  ) => NagPlanTraversedNode;
  readonly visitNagger?: (
    nagger: NaggerTraversedNode,
    context: VisitContext,
  ) => NaggerTraversedNode;
  readonly visitTaskLog?: (
    taskLog: TaskLogTraversedNode,
    context: VisitContext,
  ) => TaskLogTraversedNode;
  readonly visitTaskItem?: (
    taskItem: TaskItemTraversedNode,
    context: VisitContext,
  ) => TaskItemTraversedNode;
  readonly visitTaskEntry?: (
    taskEntry: TaskEntryTraversedNode,
    context: VisitContext,
  ) => TaskEntryTraversedNode;
};
