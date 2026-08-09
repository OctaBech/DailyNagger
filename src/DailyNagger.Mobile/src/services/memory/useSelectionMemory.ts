import { selectedPathOperations } from "@/services/core-tree-operations";
import type { Tree, TreePath } from "@/models";
import { useCallback, useMemo } from "react";
import type { Memory } from "./useMemory";
import { startDebugRenderFrame } from "@/debug/render-frame";
import { treeOperations } from "@/services/tree-operations";

export function useSelectionMemory(memory: Memory, debugName = "memory"): Memory {
  const getSelectedPath = memory.read.getSelectedPath;
  const clear = memory.write.clear;
  const baseSetSelectedPath = memory.write.setSelectedPath;
  const baseSetTree = memory.write.setTree;
  const setTreeWithoutSelectionRefresh = memory.write.setTreeWithoutSelectionRefresh;
  const baseSetTreeAndSelectedPath = memory.write.setTreeAndSelectedPath;

  const setSelectedPath = useCallback(
    (path: TreePath) => {
      const tree = memory.read.tryGetTree();

      if (tree === null) {
        startDebugRenderFrame(`${debugName}.setSelectedPath`);
        baseSetSelectedPath(path);
        return;
      }

      const result = moveSelection(tree, getSelectedPath(), path);
      startDebugRenderFrame(`${debugName}.setSelectedPath`);
      baseSetTreeAndSelectedPath(result.tree, result.treePath);
    },
    [baseSetSelectedPath, baseSetTreeAndSelectedPath, debugName, getSelectedPath, memory.read],
  );

  const setTree = useCallback(
    (tree: Tree) => {
      const currentPath = getSelectedPath();
      const selectedNode = selectedPathOperations.tryGetSelectedNode(currentPath);

      if (selectedNode === null) {
        startDebugRenderFrame(`${debugName}.setTree`);
        baseSetTree(tree);
        return;
      }

      const result = trySetFocusPath(tree, selectedNode, true);

      if (result === null) {
        startDebugRenderFrame(`${debugName}.setTree`);
        baseSetTreeAndSelectedPath(tree, []);
        return;
      }

      startDebugRenderFrame(`${debugName}.setTree`);
      baseSetTreeAndSelectedPath(result.newTree, result.newPath);
    },
    [baseSetTree, baseSetTreeAndSelectedPath, debugName, getSelectedPath],
  );

  const setTreeAndSelectedPath = useCallback(
    (tree: Tree, path: TreePath) => {
      const result = moveSelection(tree, getSelectedPath(), path);
      startDebugRenderFrame(`${debugName}.setTreeAndSelectedPath`);
      baseSetTreeAndSelectedPath(result.tree, result.treePath);
    },
    [baseSetTreeAndSelectedPath, debugName, getSelectedPath],
  );

  const setTreeAndFocusPath = useCallback(
    (tree: Tree, path: TreePath) => {
      const result = moveSelection(tree, getSelectedPath(), path);
      startDebugRenderFrame(`${debugName}.setTreeAndFocusPath`);
      baseSetTreeAndSelectedPath(result.tree, result.treePath);
    },
    [baseSetTreeAndSelectedPath, debugName, getSelectedPath],
  );

  const write = useMemo(() => {
    return {
      clear,
      setSelectedPath,
      setTree,
      setTreeWithoutSelectionRefresh,
      setTreeAndSelectedPath,
      setTreeAndFocusPath,
    };
  }, [
    clear,
    setSelectedPath,
    setTree,
    setTreeAndSelectedPath,
    setTreeAndFocusPath,
    setTreeWithoutSelectionRefresh,
  ]);

  return {
    ...memory,
    write,
  };
}

function moveSelection(
  tree: Tree,
  oldPath: TreePath,
  newPath: TreePath,
): { tree: Tree; treePath: TreePath } {
  const unselectedTree = clearFocusPath(tree, oldPath);
  const selectedNode = selectedPathOperations.tryGetSelectedNode(newPath);

  if (selectedNode === null) return { tree: unselectedTree, treePath: [] };

  const selected = trySetFocusPath(unselectedTree, selectedNode, true);
  if (selected === null) {
    throw new Error(
      `Cannot move selection because node type:${selectedNode.nodeType} could not be found in the target tree.`,
    );
  }

  return { tree: selected.newTree, treePath: selected.newPath };
}

function clearFocusPath(tree: Tree, path: TreePath): Tree {
  for (const node of path) {
    const result = trySetFocusPath(tree, node, false);
    if (result !== null) return result.newTree;
  }

  return tree;
}

function trySetFocusPath(
  tree: Tree,
  node: NonNullable<ReturnType<typeof selectedPathOperations.tryGetSelectedNode>>,
  hasFocus: boolean,
) {
  if (node.nodeType === "NagPlan") return null;

  try {
    return treeOperations.branch.setFocusPath(tree, node, hasFocus);
  } catch {
    return null;
  }
}
