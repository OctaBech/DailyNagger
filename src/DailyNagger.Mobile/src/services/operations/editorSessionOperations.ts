import type { Guid } from "@/shared";
import {
  type NagPlan,
  type Nagger,
  type TaskLog,
  type Tree,
  type TreePath,
} from "@/models";
import {
  treeMutationOperations,
  selectedPathOperations,
  treeReadOperations,
} from "@/services/core-tree-operations";

export const editorSessionOperations = {
  pruneTreeToSingleNagger,
  insertNaggerIntoTree,
  getRootVersioning,
  insertRootVersioning,
  getRefreshedPath,
} as const;

function pruneTreeToSingleNagger(naggerId: Guid, tree: Tree): NagPlan {
  return treeReadOperations.getSingleNaggerTree(tree, naggerId);
}

function insertNaggerIntoTree(nagger: Nagger, tree: Tree): Tree {
  const { replaceNagPlan } = treeMutationOperations;
  const { tryRefreshPathToNode } = selectedPathOperations;

  const pathToNagger = tryRefreshPathToNode(tree, nagger);

  const isNaggerAlreadyInTree = pathToNagger !== null;

  const nagList = tree.nags;

  const newNagList = isNaggerAlreadyInTree
    ? nagList.map((treeNagger) => {
        return treeNagger.id === nagger.id ? nagger : treeNagger;
      })
    : [...nagList, nagger];

  const { tree: newTree } = replaceNagPlan(tree, (nagPlan) => {
    return { ...nagPlan, nags: newNagList };
  });

  return newTree;
}

function getRootVersioning(
  tree: Tree,
  nagger: Nagger,
): { versionedNagger: Nagger; versionedTaskLog: TaskLog } {
  const freshPath = selectedPathOperations.tryRefreshPathToNode(tree, nagger);

  // New Nagger/TaskLog roots start at version 0 because the server has not seen them yet.
  if (freshPath === null)
    return {
      versionedNagger: { ...nagger, version: 0 },
      versionedTaskLog: { ...nagger.taskLog, version: 0 },
    };

  const { nagger: versionedNagger, taskLog: versionedTaskLog } =
    selectedPathOperations.deriveSelectedNodes(freshPath);

  if (versionedNagger === null) throw new Error();
  if (versionedTaskLog === null) throw new Error();

  return { versionedNagger, versionedTaskLog };
}

function insertRootVersioning(
  tree: Tree,
  versionedNagger: Nagger,
  versionedTaskLog: TaskLog,
): Tree {
  const { replaceNagger, replaceTaskLog } = treeMutationOperations;

  const { tree: treeVithVersionedTaskLog } = replaceTaskLog(tree, versionedTaskLog, (taskLog) => {
    return {
      ...taskLog,
      version: versionedTaskLog.version,
      updatedAt: versionedTaskLog.updatedAt,
    };
  });
  const { tree: treeWithVersionedNaggerAndTaskLog } = replaceNagger(
    treeVithVersionedTaskLog,
    versionedNagger,
    (nagger) => {
      return { ...nagger, version: versionedNagger.version };
    },
  );

  return treeWithVersionedNaggerAndTaskLog;
}

function getRefreshedPath(tree: Tree, treePath: TreePath): TreePath {
  if (treePath.length === 0) return treePath;

  return selectedPathOperations.requireRefreshedPathToSelectedNode(tree, treePath);
}
