import { nagPlanClientModelExtensionDefaults } from "@/models";
import type { Nagger, TaskEntry, TaskItem, TaskLog, Tree, TreeNode, TreePath } from "@/models";
import type { Guid } from "@/shared";
import type { TreeReader } from "./contracts";
import { targets } from "./targets";

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

type ReadNodeResult<TNode extends ReadableNode> = {
  readonly freshTree: Tree;
  readonly freshNode: TNode;
};

type ReplaceNodeResult = {
  readonly newTree: Tree;
  readonly newPath: TreePath;
};

type ReadableNode = Exclude<TreeNode, Tree>;

export const tree = {
  createNagPlan,
  getNaggerBranch,
  readNagger,
  readNode,
  readTaskEntry,
  readTaskItem,
  readTaskLog,
  replaceNode,
  replaceTaskEntry,
  replaceNagger,
} as const;

function createNagPlan(nags: readonly Nagger[]): Tree {
  return {
    nags,
    date: "editor",
    ...nagPlanClientModelExtensionDefaults,
  };
}

function getNaggerBranch(tree: Tree, naggerId: Guid): Tree {
  const nagger = tree.nags.find((candidate) => candidate.id === naggerId);

  if (nagger === undefined) {
    throw new Error(`Cannot read Nagger branch because Nagger '${naggerId}' was not found.`);
  }

  return {
    ...tree,
    nags: [nagger],
  };
}

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

function readTaskLog(memory: TreeReader, staleNode: TaskItem | TaskLog): ReadTaskLogResult {
  const freshTree = memory.read.getTree();
  let freshTaskLog: TaskLog | null = null;

  const result = targets.visitNode(freshTree, staleNode, {
    visitTaskLog: (taskLog, context) => {
      if (staleNode.nodeType === "TaskLog" && !context.isTargetNode) return taskLog;
      freshTaskLog = taskLog as TaskLog;

      return taskLog;
    },
  });

  if (result.kind === "not-found" || freshTaskLog === null) {
    throw new Error(
      `TaskLog '${staleNode.nodeType === "TaskLog" ? staleNode.id : staleNode.taskLogId}' was not found in the current tree.`,
    );
  }

  return { freshTree, freshTaskLog };
}

function readNode<TNode extends ReadableNode>(
  memory: TreeReader,
  staleNode: TNode,
): ReadNodeResult<TNode> {
  const freshTree = memory.read.getTree();
  let freshNode: ReadableNode | null = null;

  const result = targets.visitNode(freshTree, staleNode, {
    visitNagger: (nagger, context) => {
      if (context.isTargetNode) freshNode = nagger as Nagger;

      return nagger;
    },
    visitTaskLog: (taskLog, context) => {
      if (context.isTargetNode) freshNode = taskLog as TaskLog;

      return taskLog;
    },
    visitTaskItem: (taskItem, context) => {
      if (context.isTargetNode) freshNode = taskItem as TaskItem;

      return taskItem;
    },
    visitTaskEntry: (taskEntry, context) => {
      if (context.isTargetNode) freshNode = taskEntry as TaskEntry;

      return taskEntry;
    },
  });

  if (result.kind === "not-found" || freshNode === null) {
    throw new Error(`${staleNode.nodeType} '${staleNode.id}' was not found in the current tree.`);
  }

  return { freshTree, freshNode: freshNode as TNode };
}

function replaceNagger(tree: Tree, nagger: Nagger): Tree {
  const result = targets.visitNode(tree, nagger, {
    visitNagger: (currentNagger, context) => {
      return context.isTargetNode ? nagger : currentNagger;
    },
  });

  if (result.kind === "not-found") {
    throw new Error(`Nagger '${nagger.id}' was not found in the current tree.`);
  }

  return result.node as Tree;
}

function replaceTaskEntry(tree: Tree, taskEntry: TaskEntry): Tree {
  const result = targets.visitNode(tree, taskEntry, {
    visitTaskEntry: (currentTaskEntry, context) => {
      return context.isTargetNode ? taskEntry : currentTaskEntry;
    },
  });

  if (result.kind === "not-found") {
    throw new Error(`TaskEntry '${taskEntry.id}' was not found in the current tree.`);
  }

  return result.node as Tree;
}

function replaceNode(tree: Tree, node: ReadableNode): ReplaceNodeResult {
  const result = targets.visitNode(tree, node, {
    visitNagger: (currentNagger, context) => {
      return context.isTargetNode ? (node as Nagger) : currentNagger;
    },
    visitTaskLog: (currentTaskLog, context) => {
      return context.isTargetNode ? (node as TaskLog) : currentTaskLog;
    },
    visitTaskItem: (currentTaskItem, context) => {
      return context.isTargetNode ? (node as TaskItem) : currentTaskItem;
    },
    visitTaskEntry: (currentTaskEntry, context) => {
      return context.isTargetNode ? (node as TaskEntry) : currentTaskEntry;
    },
  });

  if (result.kind === "not-found") {
    throw new Error(`${node.nodeType} '${node.id}' was not found in the current tree.`);
  }

  return {
    newTree: result.node as Tree,
    newPath: result.recordedPath as TreePath,
  };
}
