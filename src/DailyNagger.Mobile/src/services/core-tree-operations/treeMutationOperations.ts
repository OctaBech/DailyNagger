import {
  type Tree,
  type NagPlan,
  type Nagger,
  type TaskLog,
  type TaskItem,
  type TaskEntry,
  type TreePath,
  type TreeNode,
} from "@/models";
import type { Guid } from "@/shared";
import {
  type ReplaceAction,
  type ReplaceNaggerNodeFn,
  type ReplaceNagPlanNodeFn,
  type ReplaceTaskEntryNodeFn,
  type ReplaceTaskItemNodeFn,
  type ReplaceTaskLogNodeFn,
} from "./replace-engine/contracts";
import { replaceNodeInNagPlan } from "./replace-engine/nagPlanTree";
import type { DtoNode, NagPlanDto } from "@/api";

type ReplaceNagPlanClientFn = (nagPlan: NagPlan) => NagPlan;
type ReplaceNaggerClientFn = (nagger: Nagger) => Nagger;
type ReplaceTaskLogClientFn = (taskLog: TaskLog) => TaskLog;
type ReplaceTaskItemClientFn = (taskItem: TaskItem) => TaskItem;
type ReplaceTaskEntryClientFn = (taskEntry: TaskEntry) => TaskEntry;

export const treeMutationOperations = {
  replaceAll,
  replaceNagPlan,
  replaceNagger,
  replaceTaskEntry,
  replaceTaskItem,
  replaceTaskLog,
  dtoToModel,
  modelToDto,
} as const;

function replaceNagPlan(
  tree: Tree,
  replaceNagPlanNodeFn: ReplaceNagPlanClientFn,
): { tree: Tree; treePath: TreePath } {
  const action: ReplaceAction = "replace-nag-plan";

  const result = replaceNodeInNagPlan(
    tree,
    action,
    {},
    {
      replaceNagPlanNodeFn: (nagPlan) => replaceNagPlanNodeFn(nagPlan as NagPlan),
    },
  );

  return { tree: result.tree as Tree, treePath: result.recordedPath as TreePath };
}

function replaceNagger(
  tree: Tree,
  nagger: Guid | Nagger,
  replaceNaggerNodeFn: ReplaceNaggerClientFn,
): { tree: Tree; treePath: TreePath } {
  const action: ReplaceAction = "replace-nagger";

  const naggerId = typeof nagger === "string" ? nagger : nagger.id;

  const result = replaceNodeInNagPlan(
    tree,
    action,
    {
      nagId: naggerId,
    },
    {
      replaceNaggerNodeFn: (nagger) => replaceNaggerNodeFn(nagger as Nagger),
    },
  );

  return { tree: result.tree as Tree, treePath: result.recordedPath as TreePath };
}

function replaceTaskLog(
  tree: Tree,
  taskLog: Guid | TaskLog,
  replaceTaskLogNodeFn: ReplaceTaskLogClientFn,
): { tree: Tree; treePath: TreePath } {
  const action: ReplaceAction = "replace-task-log";

  const taskLogId = typeof taskLog === "string" ? taskLog : taskLog.id;

  const result = replaceNodeInNagPlan(
    tree,
    action,
    { taskLogId },
    {
      replaceTaskLogNodeFn: (taskLog) => replaceTaskLogNodeFn(taskLog as TaskLog),
    },
  );

  return { tree: result.tree as Tree, treePath: result.recordedPath as TreePath };
}

function replaceTaskItem(
  tree: Tree,
  taskItem: TaskItem,
  replaceTaskItemNodeFn: ReplaceTaskItemClientFn,
): { tree: Tree; treePath: TreePath } {
  const action: ReplaceAction = "replace-task-item";

  const result = replaceNodeInNagPlan(
    tree,
    action,
    {
      taskLogId: taskItem.taskLogId,
      taskItemId: taskItem.id,
    },
    {
      replaceTaskItemNodeFn: (taskItem) => replaceTaskItemNodeFn(taskItem as TaskItem),
    },
  );

  return { tree: result.tree as Tree, treePath: result.recordedPath as TreePath };
}

function replaceTaskEntry(
  tree: Tree,
  taskEntry: TaskEntry,
  replaceTaskEntryNodeFn: ReplaceTaskEntryClientFn,
): { tree: Tree; treePath: TreePath } {
  const action: ReplaceAction = "replace-task-entry";

  const result = replaceNodeInNagPlan(
    tree,
    action,
    {
      taskLogId: taskEntry.taskLogId,
      taskItemId: taskEntry.parentTaskItemId,
      taskEntryId: taskEntry.id,
    },
    {
      replaceTaskEntryNodeFn: (taskEntry) => replaceTaskEntryNodeFn(taskEntry as TaskEntry),
    },
  );

  return { tree: result.tree as Tree, treePath: result.recordedPath as TreePath };
}

function dtoToModel(
  tree: NagPlanDto,
  replaceNagPlanNodeFn: ReplaceNagPlanNodeFn,
  replaceNaggerNodeFn: ReplaceNaggerNodeFn,
  replaceTaskLogNodeFn: ReplaceTaskLogNodeFn,
  replaceTaskItemNodeFn: ReplaceTaskItemNodeFn,
  replaceTaskEntryNodeFn: ReplaceTaskEntryNodeFn,
) {
  return replaceAllGeneric<NagPlanDto, Tree, TreeNode>(
    tree,
    replaceNagPlanNodeFn,
    replaceNaggerNodeFn,
    replaceTaskLogNodeFn,
    replaceTaskItemNodeFn,
    replaceTaskEntryNodeFn,
  );
}

function modelToDto(
  tree: Tree,
  replaceNagPlanNodeFn: ReplaceNagPlanNodeFn,
  replaceNaggerNodeFn: ReplaceNaggerNodeFn,
  replaceTaskLogNodeFn: ReplaceTaskLogNodeFn,
  replaceTaskItemNodeFn: ReplaceTaskItemNodeFn,
  replaceTaskEntryNodeFn: ReplaceTaskEntryNodeFn,
) {
  return replaceAllGeneric<Tree, NagPlanDto, TreeNode>(
    tree,
    replaceNagPlanNodeFn,
    replaceNaggerNodeFn,
    replaceTaskLogNodeFn,
    replaceTaskItemNodeFn,
    replaceTaskEntryNodeFn,
  );
}

function replaceAll(
  tree: Tree,
  replaceNagPlanNodeFn: ReplaceNagPlanNodeFn,
  replaceNaggerNodeFn: ReplaceNaggerNodeFn,
  replaceTaskLogNodeFn: ReplaceTaskLogNodeFn,
  replaceTaskItemNodeFn: ReplaceTaskItemNodeFn,
  replaceTaskEntryNodeFn: ReplaceTaskEntryNodeFn,
) {
  return replaceAllGeneric<Tree, Tree, TreeNode>(
    tree,
    replaceNagPlanNodeFn,
    replaceNaggerNodeFn,
    replaceTaskLogNodeFn,
    replaceTaskItemNodeFn,
    replaceTaskEntryNodeFn,
  );
}

function replaceAllGeneric<
  TIn extends NagPlanDto | Tree,
  TOut extends NagPlanDto | Tree,
  TPathNode extends DtoNode | TreeNode,
>(
  tree: TIn,
  replaceNagPlanNodeFn: ReplaceNagPlanNodeFn,
  replaceNaggerNodeFn: ReplaceNaggerNodeFn,
  replaceTaskLogNodeFn: ReplaceTaskLogNodeFn,
  replaceTaskItemNodeFn: ReplaceTaskItemNodeFn,
  replaceTaskEntryNodeFn: ReplaceTaskEntryNodeFn,
) {
  const action: ReplaceAction = "replace-all";

  const result = replaceNodeInNagPlan(
    tree,
    action,
    {},
    {
      replaceNagPlanNodeFn,
      replaceNaggerNodeFn,
      replaceTaskLogNodeFn,
      replaceTaskItemNodeFn,
      replaceTaskEntryNodeFn,
    },
  );

  return { tree: result.tree as TOut, recordedPath: result.recordedPath as TPathNode[] };
}
