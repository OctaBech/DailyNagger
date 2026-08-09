import type { Nagger, TaskEntry, TaskItem, TaskLog, NagPlan } from "./clientModel";
import type { Immutable } from "@/shared";

export type TreeNode = NagPlan | Nagger | TaskLog | TaskItem | TaskEntry;

export type Tree = NagPlan;

export type TreePath = TreeNode[];

export type RecordedPath = TreePath;

export type SelectedNodeType = TreeNode["nodeType"] | null;

export type SelectedNodes = Immutable<{
  readonly selectedNodeType: SelectedNodeType;
  readonly nagger: Nagger | null;
  readonly taskLog: TaskLog | null;
  readonly taskItem: TaskItem | null;
  readonly taskEntry: TaskEntry | null;
}>;

function getNodeType(node: TreeNode | undefined): SelectedNodeType {
  if (node === undefined) return null;
  if (node.nodeType !== undefined) return node.nodeType;

  if ("nags" in node) return "NagPlan";
  if ("taskLog" in node) return "Nagger";
  if ("closedOn" in node) return "TaskLog";
  if ("taskEntries" in node) return "TaskItem";
  if ("valueType" in node) return "TaskEntry";

  return null;
}

export function isNagPlan(node: TreeNode): node is NagPlan {
  return getNodeType(node) === "NagPlan";
}

export function isNagger(node: TreeNode): node is Nagger {
  return getNodeType(node) === "Nagger";
}

export function isTaskLog(node: TreeNode): node is TaskLog {
  return getNodeType(node) === "TaskLog";
}

export function isTaskItem(node: TreeNode): node is TaskItem {
  return getNodeType(node) === "TaskItem";
}

export function isTaskEntry(node: TreeNode): node is TaskEntry {
  return getNodeType(node) === "TaskEntry";
}
