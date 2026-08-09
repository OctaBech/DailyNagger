import type { Nagger, TaskItem, Tree } from "@/models";
import type { Guid } from "@/shared";
import type { TreeReader } from "./contracts";
import { selectedPathOperations } from "./selectedPathOperations";

export const treeReadOperations = {
  getSingleNaggerTree,
  requireNagger,
  requireSingleNagger,
  requireTaskItem,
} as const;

type RequireTaskItemResult = {
  readonly freshTree: Tree;
  readonly freshTaskItem: TaskItem;
};

function requireTaskItem(treeReader: TreeReader, taskItem: TaskItem): RequireTaskItemResult {
  const freshTree = treeReader.read.getTree();
  const treePath = selectedPathOperations.refreshPathToNode(freshTree, taskItem);
  const { taskItem: freshTaskItem } = selectedPathOperations.deriveSelectedNodes(treePath);

  if (freshTaskItem === null) {
    throw new Error(`Cannot read TaskItem because TaskItem:${taskItem.id} was not found.`);
  }

  return { freshTree, freshTaskItem };
}

function getSingleNaggerTree(tree: Tree, naggerId: Guid): Tree {
  return { ...tree, nags: [requireNagger(tree, naggerId)] };
}

function requireNagger(tree: Tree, naggerId: Guid): Nagger {
  const nagger = tree.nags.find((nagger) => nagger.id === naggerId);

  if (nagger === undefined) {
    throw new Error(`Cannot read Nagger because Nagger:${naggerId} was not found.`);
  }

  return nagger;
}

function requireSingleNagger<TNagger extends Nagger>(tree: Tree): TNagger;
function requireSingleNagger<TNagger>(tree: { readonly nags: readonly TNagger[] }): TNagger;
function requireSingleNagger<TNagger>(tree: { readonly nags: readonly TNagger[] }): TNagger {
  const nagger = tree.nags[0];

  if (nagger === undefined) {
    throw new Error("Cannot read single Nagger because tree contains no naggers.");
  }

  return nagger;
}
