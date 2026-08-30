import type { Memory } from "@/services/memory";
import type { Observability } from "./observabilityContext";
import { recordMemoryOperation } from "./recordMemoryOperation";

type CreateCommandScopedMemoryInput = {
  readonly memory: Memory;
  readonly memoryName: string;
  readonly observability: Observability;
};

export function createCommandScopedMemory({
  memory,
  memoryName,
  observability,
}: CreateCommandScopedMemoryInput): Memory {
  return {
    ...memory,
    write: {
      clear: () =>
        recordMemoryOperation(observability, memoryName, "clear", () => memory.write.clear()),
      setSelectedPath: (path) =>
        recordMemoryOperation(observability, memoryName, "setSelectedPath", () =>
          memory.write.setSelectedPath(path),
        ),
      setTree: (tree) =>
        recordMemoryOperation(observability, memoryName, "setTree", () =>
          memory.write.setTree(tree),
        ),
      setTreeAndFocusPath: (tree, path) =>
        recordMemoryOperation(observability, memoryName, "setTreeAndFocusPath", () =>
          memory.write.setTreeAndFocusPath(tree, path),
        ),
      setTreeAndSelectedPath: (tree, path) =>
        recordMemoryOperation(observability, memoryName, "setTreeAndSelectedPath", () =>
          memory.write.setTreeAndSelectedPath(tree, path),
        ),
      setTreeWithoutSelectionRefresh: (tree) =>
        recordMemoryOperation(observability, memoryName, "setTreeWithoutSelectionRefresh", () =>
          memory.write.setTreeWithoutSelectionRefresh(tree),
        ),
    },
  };
}
