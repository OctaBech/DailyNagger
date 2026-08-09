import type { Guid } from "@/shared";
import type {
  NaggerTraversedNode,
  TaskEntryTraversedNode,
  TaskItemTraversedNode,
  TaskLogTraversedNode,
  TraversedNode,
} from "../../core-tree-operations/traversed-node/contracts";
import type { TreeTarget } from "../tree-visitor/contracts";

export const branchTargetGuards = {
  assertBranchRootCanContainTarget,
};

export function assertBranchRootCanContainTarget(
  branchRoot: TraversedNode,
  target: TreeTarget,
): void {
  if (isNaggerBranchRoot(branchRoot)) {
    assertSameGuid("nagger id", branchRoot.id, getTargetNaggerId(target));
    return;
  }

  if (isTaskLogBranchRoot(branchRoot)) {
    assertTargetCanBeUnderBranch(target, "task-log");
    assertSameGuid("task log id", branchRoot.id, getTargetTaskLogId(target));
    return;
  }

  if (isTaskItemBranchRoot(branchRoot)) {
    assertTargetCanBeUnderBranch(target, "task-item");
    assertSameGuid("task item taskLogId", branchRoot.taskLogId, getTargetTaskLogId(target));

    if (target.kind === "task-item" && target.id !== branchRoot.id) {
      assertTaskItemTargetCanBeUnderTaskItemBranch(branchRoot, target);
    }

    return;
  }

  if (isTaskEntryBranchRoot(branchRoot)) {
    if (target.kind !== "task-entry") {
      throw new Error(`Target '${target.kind}' cannot be found under a task-entry branch.`);
    }

    assertSameGuid("task entry id", branchRoot.id, target.id);
    assertSameGuid("task entry taskLogId", branchRoot.taskLogId, target.requiredAncestry.taskLogId);
    assertSameGuid(
      "task entry parentTaskItemId",
      branchRoot.parentTaskItemId,
      target.requiredAncestry.taskItemId,
    );

    return;
  }

  throw new Error("NagPlan root should use root tree operations, not branch operations.");
}

function assertTaskItemTargetCanBeUnderTaskItemBranch(
  branchRoot: TaskItemTraversedNode,
  target: Extract<TreeTarget, { readonly kind: "task-item" }>,
): void {
  if (target.requiredAncestry.parentTaskItemId === null) {
    throw new Error("Top-level task-item target cannot be found under a task-item branch.");
  }

  if (target.requiredAncestry.parentTaskItemId === branchRoot.id) return;

  // A nested task-item target only carries immediate parent ancestry, not full ancestry.
  // Same taskLogId means the branch may still contain the target deeper down.
}

function assertTargetCanBeUnderBranch(
  target: TreeTarget,
  branchKind: "task-log" | "task-item",
): asserts target is Exclude<TreeTarget, { readonly kind: "nagger" }> {
  if (target.kind === "nagger") {
    throw new Error(`Target '${target.kind}' cannot be found under a ${branchKind} branch.`);
  }
}

function getTargetNaggerId(target: TreeTarget): Guid {
  if (target.kind === "nagger") return target.id;
  return target.requiredAncestry.naggerId;
}

function getTargetTaskLogId(target: Exclude<TreeTarget, { readonly kind: "nagger" }>): Guid {
  if (target.kind === "task-log") return target.id;
  return target.requiredAncestry.taskLogId;
}

function assertSameGuid(label: string, actual: Guid, expected: Guid): void {
  if (actual === expected) return;

  throw new Error(`Branch target mismatch for ${label}.`);
}

function isNaggerBranchRoot(node: TraversedNode): node is NaggerTraversedNode {
  return "taskLog" in node;
}

function isTaskLogBranchRoot(node: TraversedNode): node is TaskLogTraversedNode {
  return "taskItems" in node && !("taskEntries" in node);
}

function isTaskItemBranchRoot(node: TraversedNode): node is TaskItemTraversedNode {
  return "taskEntries" in node;
}

function isTaskEntryBranchRoot(node: TraversedNode): node is TaskEntryTraversedNode {
  return "parentTaskItemId" in node && !("taskItems" in node) && !("taskEntries" in node);
}
