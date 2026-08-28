import type { Memory } from "@/services/memory";
import type { ObservabilityContext } from "./observabilityContext";
import { recordMemoryOperation } from "./recordMemoryOperation";

type CreateCommandScopedMemoryInput = {
  readonly memory: Memory;
  readonly memoryName: string;
  readonly observabilityContext: ObservabilityContext;
};

export function createCommandScopedMemory({
  memory,
  memoryName,
  observabilityContext,
}: CreateCommandScopedMemoryInput): Memory {
  return {
    ...memory,
    write: {
      clear: () =>
        recordMemoryOperation(observabilityContext, memoryName, "clear", () =>
          memory.write.clear(),
        ),
      setSelectedPath: (path) =>
        recordMemoryOperation(observabilityContext, memoryName, "setSelectedPath", () =>
          memory.write.setSelectedPath(path),
        ),
      setTree: (tree) =>
        recordMemoryOperation(observabilityContext, memoryName, "setTree", () =>
          memory.write.setTree(tree),
        ),
      setTreeAndFocusPath: (tree, path) =>
        recordMemoryOperation(observabilityContext, memoryName, "setTreeAndFocusPath", () =>
          memory.write.setTreeAndFocusPath(tree, path),
        ),
      setTreeAndSelectedPath: (tree, path) =>
        recordMemoryOperation(observabilityContext, memoryName, "setTreeAndSelectedPath", () =>
          memory.write.setTreeAndSelectedPath(tree, path),
        ),
      setTreeWithoutSelectionRefresh: (tree) =>
        recordMemoryOperation(
          observabilityContext,
          memoryName,
          "setTreeWithoutSelectionRefresh",
          () => memory.write.setTreeWithoutSelectionRefresh(tree),
        ),
    },
  };
}
