import type { TreePath, Tree, TreeWithSelection } from "@/models";
import type { Prettify } from "@/shared";
import { useMemo, useState } from "react";
import { createStore, useStore } from "zustand";

type MemoryState = {
  readonly tree: Tree | null;
  readonly selectedPath: TreePath;
};

const freshMemoryState: MemoryState = {
  tree: null,
  selectedPath: [],
};

type MemoryActions = {
  readonly clear: () => void;
  readonly setTree: (tree: Tree) => void;
  readonly setTreeWithoutSelectionRefresh: (tree: Tree) => void;
  readonly setSelectedPath: (path: TreePath) => void;
  readonly setTreeAndSelectedPath: (tree: Tree, path: TreePath) => void;
  readonly setTreeAndFocusPath: (tree: Tree, path: TreePath) => void;
  readonly getTree: () => Tree;
  readonly tryGetTree: () => Tree | null;
  readonly getSelectedPath: () => TreePath;
  readonly getTreeAndSelectedPath: () => TreeWithSelection;
};

type ZustandStore = MemoryState & MemoryActions;

function createZustandStore() {
  return createStore<ZustandStore>((set, get) => {
    return {
      ...freshMemoryState,
      clear() {
        set((_state) => ({ ...freshMemoryState }));
      },
      setTree(tree: Tree) {
        set((_state) => ({ tree }));
      },
      setTreeWithoutSelectionRefresh(tree: Tree) {
        set((_state) => ({ tree }));
      },
      setSelectedPath(path: TreePath) {
        set(() => ({
          selectedPath: path,
        }));
      },
      setTreeAndSelectedPath(tree: Tree, path: TreePath) {
        set(() => ({
          tree,
          selectedPath: path,
        }));
      },
      setTreeAndFocusPath(tree: Tree, path: TreePath) {
        set(() => ({
          tree,
          selectedPath: path,
        }));
      },
      getTree() {
        const tree = get().tree;
        if (tree === null) {
          throw new Error("Cannot read missing tree.");
        }
        return tree;
      },
      tryGetTree() {
        return get().tree;
      },
      getSelectedPath() {
        return get().selectedPath;
      },
      getTreeAndSelectedPath() {
        const tree = get().getTree();
        const selectedPath = get().selectedPath;
        return { tree, selectedPath };
      },
    };
  });
}

export type Memory = Prettify<ReturnType<typeof useMemory>>;

export const useMemory = () => {
  const [zustandStore] = useState(() => createZustandStore());

  const {
    tree,
    selectedPath,
    clear,
    setTree,
    setTreeWithoutSelectionRefresh,
    setSelectedPath,
    setTreeAndSelectedPath,
    setTreeAndFocusPath,
    getTree,
    tryGetTree,
    getSelectedPath,
    getTreeAndSelectedPath,
  } = useStore(zustandStore);

  return useMemo(() => {
    return {
      state: { tree, selectedPath },
      read: { getTree, tryGetTree, getSelectedPath, getTreeAndSelectedPath },
      write: {
        clear,
        setTreeAndSelectedPath,
        setTreeAndFocusPath,
        setTree,
        setTreeWithoutSelectionRefresh,
        setSelectedPath,
      },
    };
  }, [
    clear,
    tree,
    selectedPath,
    getTree,
    tryGetTree,
    getSelectedPath,
    getTreeAndSelectedPath,
    setTreeAndSelectedPath,
    setTreeAndFocusPath,
    setTree,
    setTreeWithoutSelectionRefresh,
    setSelectedPath,
  ]);
};
