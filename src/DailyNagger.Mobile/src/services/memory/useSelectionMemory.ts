import { treeSelection } from "@/models/treeSelection";
import type { Tree, TreeNode, TreePath } from "@/models";
import { useCallback, useMemo } from "react";
import type { Memory } from "./useMemory";
import { startDebugRenderFrame } from "@/debug/render-frame";
import { treeOperations } from "@/services/tree-operations";
import type { EventEmitter } from "@/shared";

export type MemoryEventType =
  | "clear"
  | "setSelectedPath"
  | "setTree"
  | "setTreeWithoutSelectionRefresh"
  | "setTreeAndSelectedPath"
  | "setTreeAndFocusPath";

export type MemoryEvent = {
  readonly memoryName: string;
  readonly operation: MemoryEventType;
};

export function useSelectionMemory(
  memory: Memory,
  debugName = "memory",
  memoryEvents?: EventEmitter<MemoryEventType, MemoryEvent>,
): Memory {
  const getSelectedPath = memory.read.getSelectedPath;
  const baseClear = memory.write.clear;
  const baseSetSelectedPath = memory.write.setSelectedPath;
  const baseSetTree = memory.write.setTree;
  const baseSetTreeWithoutSelectionRefresh = memory.write.setTreeWithoutSelectionRefresh;
  const baseSetTreeAndSelectedPath = memory.write.setTreeAndSelectedPath;

  const recordMemoryEvent = useCallback(
    (operation: MemoryEventType): void => {
      startDebugRenderFrame(`${debugName}.${operation}`);
      memoryEvents?.emit(operation, { memoryName: debugName, operation });
    },
    [debugName, memoryEvents],
  );

  const clear = useCallback(() => {
    recordMemoryEvent("clear");
    baseClear();
  }, [baseClear, recordMemoryEvent]);

  const setSelectedPath = useCallback(
    (path: TreePath) => {
      const tree = memory.read.tryGetTree();

      if (tree === null) {
        recordMemoryEvent("setSelectedPath");
        baseSetSelectedPath(path);
        return;
      }

      const result = moveSelection(tree, getSelectedPath(), path);
      recordMemoryEvent("setSelectedPath");
      baseSetTreeAndSelectedPath(result.tree, result.treePath);
    },
    [baseSetSelectedPath, baseSetTreeAndSelectedPath, getSelectedPath, memory.read, recordMemoryEvent],
  );

  const setTree = useCallback(
    (tree: Tree) => {
      const currentPath = getSelectedPath();
      const selectedNode = treeSelection.tryGetSelectedNode(currentPath);

      if (selectedNode === null) {
        recordMemoryEvent("setTree");
        baseSetTree(tree);
        return;
      }

      const result = trySetFocusPath(tree, selectedNode, true);

      if (result === null) {
        recordMemoryEvent("setTree");
        baseSetTreeAndSelectedPath(tree, []);
        return;
      }

      recordMemoryEvent("setTree");
      baseSetTreeAndSelectedPath(result.newTree, result.newPath);
    },
    [baseSetTree, baseSetTreeAndSelectedPath, getSelectedPath, recordMemoryEvent],
  );

  const setTreeWithoutSelectionRefresh = useCallback(
    (tree: Tree) => {
      recordMemoryEvent("setTreeWithoutSelectionRefresh");
      baseSetTreeWithoutSelectionRefresh(tree);
    },
    [baseSetTreeWithoutSelectionRefresh, recordMemoryEvent],
  );

  const setTreeAndSelectedPath = useCallback(
    (tree: Tree, path: TreePath) => {
      const result = moveSelection(tree, getSelectedPath(), path);
      recordMemoryEvent("setTreeAndSelectedPath");
      baseSetTreeAndSelectedPath(result.tree, result.treePath);
    },
    [baseSetTreeAndSelectedPath, getSelectedPath, recordMemoryEvent],
  );

  const setTreeAndFocusPath = useCallback(
    (tree: Tree, path: TreePath) => {
      const result = moveSelection(tree, getSelectedPath(), path);
      recordMemoryEvent("setTreeAndFocusPath");
      baseSetTreeAndSelectedPath(result.tree, result.treePath);
    },
    [baseSetTreeAndSelectedPath, getSelectedPath, recordMemoryEvent],
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
  const selectedNode = treeSelection.tryGetSelectedNode(newPath);

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

function trySetFocusPath(tree: Tree, node: TreeNode, hasFocus: boolean) {
  if (node.nodeType === "NagPlan") return null;

  try {
    return treeOperations.branch.setFocusPath(tree, node, hasFocus);
  } catch {
    return null;
  }
}

