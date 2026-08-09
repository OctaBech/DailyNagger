import { assertNever } from "@/shared";
import type {
  NagPlanTraversedNode,
  NaggerTraversedNode,
  TaskLogTraversedNode,
  TaskItemTraversedNode,
  TaskEntryTraversedNode,
} from "../traversed-node/contracts";

import type {
  ReplaceContext,
  ReplaceResult,
  ReplaceAction,
  ReplaceFunctions,
  ReplacePath,
} from "./contracts";
import { found, notFound, recordPath, recordPathIfFound } from "./contracts";
import { copyArrayReplaceElement } from "./copyArrayReplaceElement";
import { createThrowingUpdateFunctions } from "./createThrowingUpdateFunctions";
import { createPassingUpdateFunctions } from "./createPassingUpdateFunctions";

export function replaceNodeInNagPlan(
  tree: NagPlanTraversedNode,
  action: ReplaceAction,
  path: ReplacePath,
  functions: Partial<ReplaceFunctions>,
) {
  const recordedPath: ReplaceContext["recordedPath"] = [];

  const fallbackReplaceFunctions =
    action === "replace-all"
      ? createPassingUpdateFunctions()
      : createThrowingUpdateFunctions(action);

  const result = replaceNagPlan(
    {
      action,
      path,
      functions: {
        ...fallbackReplaceFunctions,
        ...functions,
      },
      recordedPath,
    },
    tree,
  );

  return { tree: result.element, recordedPath };
}

function replaceNagPlan(
  replaceContext: ReplaceContext,
  nagPlan: NagPlanTraversedNode,
): ReplaceResult<NagPlanTraversedNode> {
  switch (replaceContext.action) {
    case "replace-nag-plan":
      return recordPath(replaceContext, replaceContext.functions.replaceNagPlanNodeFn(nagPlan));
    case "replace-nagger":
    case "replace-task-log":
    case "replace-task-item":
    case "replace-task-entry":
      return recordPathIfFound(replaceContext, copyNagPlanReplaceNags(replaceContext, nagPlan));
    case "replace-all":
      const { element: nagPlanReplacedNaggers } = copyNagPlanReplaceNags(replaceContext, nagPlan);
      const newNagPlan = replaceContext.functions.replaceNagPlanNodeFn(nagPlanReplacedNaggers);
      return recordPath(replaceContext, newNagPlan);
    default:
      assertNever(replaceContext.action);
  }
}

function copyNagPlanReplaceNags(
  replaceContext: ReplaceContext,
  nagPlan: NagPlanTraversedNode,
): ReplaceResult<NagPlanTraversedNode> {
  const shouldTryReplace = getIsNaggerInUpdatePath(replaceContext);
  const replaceElement = (element: NaggerTraversedNode) => replaceNagger(replaceContext, element);

  const { indexFound, newArray } = copyArrayReplaceElement(
    replaceContext,
    nagPlan,
    nagPlan.nags,
    shouldTryReplace,
    replaceElement,
  );

  if (indexFound === -1)
    throw new Error(
      `function:copyNagPlanReplaceNags could not find nagger:${replaceContext.path.nagId}`,
    );

  const newNagPlan = {
    ...nagPlan,
    nags: newArray,
    clientProps: {
      ...nagPlan.clientProps,
      indexHint: indexFound,
    },
  };

  return found(newNagPlan);
}

function getIsNaggerInUpdatePath(
  replaceContext: ReplaceContext,
): (nagger: NaggerTraversedNode) => boolean {
  const { nagId, taskLogId } = replaceContext.path;
  return nagId !== undefined
    ? (nagger: NaggerTraversedNode) => nagger.id === nagId
    : (nagger: NaggerTraversedNode) => nagger.taskLog.id === taskLogId;
}

function replaceNagger(
  replaceContext: ReplaceContext,
  nagger: NaggerTraversedNode,
): ReplaceResult<NaggerTraversedNode> {
  switch (replaceContext.action) {
    case "replace-nagger":
      return recordPath(replaceContext, replaceContext.functions.replaceNaggerNodeFn(nagger));
    case "replace-task-log":
    case "replace-task-item":
    case "replace-task-entry":
      return recordPathIfFound(replaceContext, copyNaggerReplaceTaskLog(replaceContext, nagger));
    case "replace-all":
      const { element: naggerReplacedTaskLog } = copyNaggerReplaceTaskLog(replaceContext, nagger);
      const newNagger = replaceContext.functions.replaceNaggerNodeFn(naggerReplacedTaskLog);
      return recordPath(replaceContext, newNagger);
    case "replace-nag-plan":
      throw new Error(`ActionType:${replaceContext.action} entered function:replaceNagger`);
    default:
      assertNever(replaceContext.action);
  }
}

function copyNaggerReplaceTaskLog(
  replaceContext: ReplaceContext,
  nagger: NaggerTraversedNode,
): ReplaceResult<NaggerTraversedNode> {
  const taskLog = nagger.taskLog;

  if (replaceContext.action !== "replace-all" && taskLog.id !== replaceContext.path.taskLogId)
    throw new Error(
      `copyNaggerReplaceTaskLog expected taskLog:${replaceContext.path.taskLogId}, got taskLog:${taskLog.id} for action:${replaceContext.action}`,
    );

  const { element } = replaceTaskLog(replaceContext, taskLog);

  const newNag = { ...nagger, taskLog: element };

  return found(newNag);
}

function replaceTaskLog(
  replaceContext: ReplaceContext,
  taskLog: TaskLogTraversedNode,
): ReplaceResult<TaskLogTraversedNode> {
  switch (replaceContext.action) {
    case "replace-task-log":
      return recordPath(replaceContext, replaceContext.functions.replaceTaskLogNodeFn(taskLog));
    case "replace-task-item":
    case "replace-task-entry":
      return recordPathIfFound(
        replaceContext,
        copyTaskLogReplaceTaskItems(replaceContext, taskLog),
      );
    case "replace-all":
      const { element: taskLogReplacedItems } = copyTaskLogReplaceTaskItems(
        replaceContext,
        taskLog,
      );
      const newTaskLog = replaceContext.functions.replaceTaskLogNodeFn(taskLogReplacedItems);
      return recordPath(replaceContext, newTaskLog);
    case "replace-nag-plan":
    case "replace-nagger":
      throw new Error(`ActionType:${replaceContext.action} entered function:replaceTaskLog`);
    default:
      assertNever(replaceContext.action);
  }
}

function copyTaskLogReplaceTaskItems(
  replaceContext: ReplaceContext,
  taskLog: TaskLogTraversedNode,
): ReplaceResult<TaskLogTraversedNode> {
  const shouldTryReplace = () => true;
  const replaceElement = (element: TaskItemTraversedNode) =>
    replaceTaskItem(replaceContext, element);

  const { indexFound, newArray } = copyArrayReplaceElement(
    replaceContext,
    taskLog,
    taskLog.taskItems,
    shouldTryReplace,
    replaceElement,
  );

  if (indexFound === -1)
    throw new Error(
      `Function:copyTaskLogReplaceTaskItems could not find taskItem:${replaceContext.path.taskItemId}`,
    );

  const newTaskLog = {
    ...taskLog,
    taskItems: newArray,
    clientProps: { ...taskLog.clientProps, indexHint: indexFound },
  };

  return found(newTaskLog);
}

function replaceTaskItem(
  replaceContext: ReplaceContext,
  taskItem: TaskItemTraversedNode,
): ReplaceResult<TaskItemTraversedNode> {
  switch (replaceContext.action) {
    case "replace-task-item":
      if (taskItem.id === replaceContext.path.taskItemId)
        return recordPath(replaceContext, replaceContext.functions.replaceTaskItemNodeFn(taskItem));
      return recordPathIfFound(
        replaceContext,
        copyTaskItemReplaceTaskItems(replaceContext, taskItem),
      );
    case "replace-task-entry":
      if (taskItem.id === replaceContext.path.taskItemId)
        return recordPathIfFound(
          replaceContext,
          copyTaskItemReplaceTaskEntries(replaceContext, taskItem),
        );
      return recordPathIfFound(
        replaceContext,
        copyTaskItemReplaceTaskItems(replaceContext, taskItem),
      );
    case "replace-all":
      const { element: taskItemReplacedItems } = copyTaskItemReplaceTaskItems(
        replaceContext,
        taskItem,
      );
      const { element: taskItemReplacedItemsAndEntries } = copyTaskItemReplaceTaskEntries(
        replaceContext,
        taskItemReplacedItems,
      );
      const newTaskItem = replaceContext.functions.replaceTaskItemNodeFn(
        taskItemReplacedItemsAndEntries,
      );
      return recordPath(replaceContext, newTaskItem);
    case "replace-nag-plan":
    case "replace-nagger":
    case "replace-task-log":
      throw new Error(`ActionType:${replaceContext.action} entered function:replaceTaskItem`);
    default:
      assertNever(replaceContext.action);
  }
}

function copyTaskItemReplaceTaskItems(
  replaceContext: ReplaceContext,
  taskItem: TaskItemTraversedNode,
): ReplaceResult<TaskItemTraversedNode> {
  const shouldTryReplace = () => true;
  const replaceElement = (element: TaskItemTraversedNode) =>
    replaceTaskItem(replaceContext, element);

  const { indexFound, newArray } = copyArrayReplaceElement(
    replaceContext,
    taskItem,
    taskItem.taskItems,
    shouldTryReplace,
    replaceElement,
  );

  if (indexFound === -1) return notFound(taskItem);

  const newTaskItem: TaskItemTraversedNode = {
    ...taskItem,
    taskItems: newArray,
    clientProps: { ...taskItem.clientProps, indexHint: indexFound },
  };

  return found(newTaskItem);
}

function copyTaskItemReplaceTaskEntries(
  replaceContext: ReplaceContext,
  taskItem: TaskItemTraversedNode,
): ReplaceResult<TaskItemTraversedNode> {
  const shouldTryReplace = (element: TaskEntryTraversedNode) =>
    element.id === replaceContext.path.taskEntryId;
  const replaceElement = (element: TaskEntryTraversedNode) =>
    replaceTaskEntry(replaceContext, element);

  const { indexFound, newArray } = copyArrayReplaceElement(
    replaceContext,
    taskItem,
    taskItem.taskEntries,
    shouldTryReplace,
    replaceElement,
  );

  if (indexFound === -1) throw new Error(`TaskEntry:${replaceContext.path.taskEntryId} not found`);

  const newTaskItem = {
    ...taskItem,
    taskEntries: newArray,
    clientProps: { ...taskItem.clientProps, indexHint: indexFound },
  };

  return found(newTaskItem);
}

function replaceTaskEntry(
  replaceContext: ReplaceContext,
  taskEntry: TaskEntryTraversedNode,
): ReplaceResult<TaskEntryTraversedNode> {
  switch (replaceContext.action) {
    case "replace-task-entry":
    case "replace-all":
      return recordPath(replaceContext, replaceContext.functions.replaceTaskEntryNodeFn(taskEntry));
    case "replace-nag-plan":
    case "replace-nagger":
    case "replace-task-log":
    case "replace-task-item":
      throw new Error(`ActionType:${replaceContext.action} entered function:replaceTaskEntry`);
    default:
      assertNever(replaceContext.action);
  }
}

