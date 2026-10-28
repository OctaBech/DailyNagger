import { useState } from "react";
import { createStore, useStore } from "zustand";
import type { TaskItem, TaskEntry } from "@/models";

type ClipboardNode = TaskItem | TaskEntry;

type ClipboardStore = {
  readonly node: ClipboardNode | null;
  readonly copy: (node: ClipboardNode) => void;
  readonly read: () => ClipboardNode;
  readonly getNodeType: () => ClipboardNode["nodeType"] | null;
  readonly clear: () => void;
};

function createNodeClipboardStore() {
  return createStore<ClipboardStore>((set, get) => ({
    node: null,

    copy(node) {
      set({ node });
    },

    read() {
      const node = get().node;

      if (node === null) {
        throw new Error("Cannot paste: clipboard is empty.");
      }

      return node;
    },

    getNodeType() {
      return get().node?.nodeType ?? null;
    },

    clear() {
      set({ node: null });
    },
  }));
}

export function useNodeClipboard() {
  const [store] = useState(createNodeClipboardStore);
  const nodeType = useStore(store, (state) => state.node?.nodeType ?? null);
  const { copy, read, getNodeType, clear } = store.getState();

  return { copy, read, getNodeType, clear, nodeType };
}

export type NodeClipboard = ReturnType<typeof useNodeClipboard>;
