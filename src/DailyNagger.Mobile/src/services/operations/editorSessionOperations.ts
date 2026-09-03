import { type Nagger, type TaskLog, type Tree, type TreePath } from "@/models";
import { treeSelection } from "@/models/treeSelection";
import { treeOperations } from "@/services/tree-operations";

export const editorSessionOperations = {
  insertNaggerIntoTree,
  getRootVersioning,
  insertRootVersioning,
  getRefreshedPath,
} as const;

function insertNaggerIntoTree(nagger: Nagger, tree: Tree): Tree {
  const pathToNagger = treeOperations.tree.tryRefreshPathToNode(tree, nagger);

  const isNaggerAlreadyInTree = pathToNagger !== null;

  const nagList = tree.nags;

  const newNagList = isNaggerAlreadyInTree
    ? nagList.map((treeNagger) => {
        return treeNagger.id === nagger.id ? nagger : treeNagger;
      })
    : [...nagList, nagger];

  return { ...tree, nags: newNagList };
}

function getRootVersioning(
  tree: Tree,
  nagger: Nagger,
): { versionedNagger: Nagger; versionedTaskLog: TaskLog } {
  const freshPath = treeOperations.tree.tryRefreshPathToNode(tree, nagger);

  // New Nagger/TaskLog roots start at version 0 because the server has not seen them yet.
  if (freshPath === null)
    return {
      versionedNagger: { ...nagger, version: 0 },
      versionedTaskLog: { ...nagger.taskLog, version: 0 },
    };

  const { nagger: versionedNagger, taskLog: versionedTaskLog } =
    treeSelection.deriveSelectedNodes(freshPath);

  if (versionedNagger === null) throw new Error();
  if (versionedTaskLog === null) throw new Error();

  return { versionedNagger, versionedTaskLog };
}

function insertRootVersioning(
  tree: Tree,
  versionedNagger: Nagger,
  versionedTaskLog: TaskLog,
): Tree {
  const treeWithVersionedTaskLog = treeOperations.tree.replaceNode(tree, {
    ...versionedTaskLog,
    version: versionedTaskLog.version,
    updatedAt: versionedTaskLog.updatedAt,
  }).newTree;

  let wasNaggerVersioned = false;
  const nags = treeWithVersionedTaskLog.nags.map((nagger) => {
    if (nagger.id !== versionedNagger.id) return nagger;

    wasNaggerVersioned = true;
    return { ...nagger, version: versionedNagger.version };
  });

  if (!wasNaggerVersioned) {
    throw new Error(
      `Cannot insert root versioning because Nagger '${versionedNagger.id}' is missing.`,
    );
  }

  return { ...treeWithVersionedTaskLog, nags };
}

function getRefreshedPath(tree: Tree, treePath: TreePath): TreePath {
  if (treePath.length === 0) return treePath;

  return treeOperations.tree.refreshPathToNode(tree, treeSelection.requireSelectedNode(treePath));
}
