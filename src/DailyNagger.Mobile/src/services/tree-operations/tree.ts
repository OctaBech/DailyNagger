import type { Nagger, TaskEntry, TaskItem, TaskLog, Tree } from "@/models";
import type { TreeReader } from "./contracts";
import { targets } from "./targets";
import { treeMutationOperations } from "@/services/core-tree-operations";

type ReadNaggerResult = {
  readonly freshTree: Tree;
  readonly freshNagger: Nagger;
};

type ReadTaskItemResult = {
  readonly freshTree: Tree;
  readonly freshTaskItem: TaskItem;
};

type ReadTaskEntryResult = {
  readonly freshTree: Tree;
  readonly freshTaskEntry: TaskEntry;
};

type ReadTaskLogResult = {
  readonly freshTree: Tree;
  readonly freshTaskLog: TaskLog;
};

export const tree = {
  readNagger,
  readTaskEntry,
  readTaskItem,
  readTaskLog,
  replaceTaskEntry,
  replaceNagger,
} as const;

function readNagger(memory: TreeReader, staleNagger: Nagger): ReadNaggerResult {
  const freshTree = memory.read.getTree();
  let freshNagger: Nagger | null = null;

  const result = targets.visitNode(freshTree, staleNagger, {
    visitNagger: (nagger, context) => {
      if (context.isTargetNode) freshNagger = nagger as Nagger;

      return nagger;
    },
  });

  if (result.kind === "not-found" || freshNagger === null) {
    throw new Error(`Nagger '${staleNagger.id}' was not found in the current tree.`);
  }

  return { freshTree, freshNagger };
}

function readTaskItem(memory: TreeReader, staleTaskItem: TaskItem): ReadTaskItemResult {
  const freshTree = memory.read.getTree();
  let freshTaskItem: TaskItem | null = null;

  const result = targets.visitNode(freshTree, staleTaskItem, {
    visitTaskItem: (taskItem, context) => {
      if (context.isTargetNode) freshTaskItem = taskItem as TaskItem;

      return taskItem;
    },
  });

  if (result.kind === "not-found" || freshTaskItem === null) {
    throw new Error(`TaskItem '${staleTaskItem.id}' was not found in the current tree.`);
  }

  return { freshTree, freshTaskItem };
}

function readTaskEntry(memory: TreeReader, staleTaskEntry: TaskEntry): ReadTaskEntryResult {
  const freshTree = memory.read.getTree();
  let freshTaskEntry: TaskEntry | null = null;

  const result = targets.visitNode(freshTree, staleTaskEntry, {
    visitTaskEntry: (taskEntry, context) => {
      if (context.isTargetNode) freshTaskEntry = taskEntry as TaskEntry;

      return taskEntry;
    },
  });

  if (result.kind === "not-found" || freshTaskEntry === null) {
    throw new Error(`TaskEntry '${staleTaskEntry.id}' was not found in the current tree.`);
  }

  return { freshTree, freshTaskEntry };
}

function readTaskLog(memory: TreeReader, staleTaskItem: TaskItem): ReadTaskLogResult {
  const freshTree = memory.read.getTree();
  let freshTaskLog: TaskLog | null = null;

  const result = targets.visitNode(freshTree, staleTaskItem, {
    visitTaskLog: (taskLog) => {
      freshTaskLog = taskLog as TaskLog;

      return taskLog;
    },
  });

  if (result.kind === "not-found" || freshTaskLog === null) {
    throw new Error(
      `TaskLog '${staleTaskItem.taskLogId}' was not found in the current tree.`,
    );
  }

  return { freshTree, freshTaskLog };
}

function replaceNagger(tree: Tree, nagger: Nagger): Tree {
  const { tree: newTree } = treeMutationOperations.replaceNagger(tree, nagger, () => nagger);

  return newTree;
}

function replaceTaskEntry(tree: Tree, taskEntry: TaskEntry): Tree {
  const { tree: newTree } = treeMutationOperations.replaceTaskEntry(
    tree,
    taskEntry,
    () => taskEntry,
  );

  return newTree;
}
