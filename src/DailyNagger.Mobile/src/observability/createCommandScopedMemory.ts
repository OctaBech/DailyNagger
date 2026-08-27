import type { Memory } from "@/services/memory";
import type { CommandTraceKey } from "./commandTraceKey";
import { recordMemoryOperation } from "./recordMemoryOperation";

type CreateCommandScopedMemoryInput = {
  readonly commandTraceKey: CommandTraceKey;
  readonly memory: Memory;
  readonly memoryName: string;
};

export function createCommandScopedMemory({
  commandTraceKey,
  memory,
  memoryName,
}: CreateCommandScopedMemoryInput): Memory {
  return {
    ...memory,
    write: {
      clear: () =>
        recordMemoryOperation({ commandTraceKey, memoryName, operation: "clear" }, () =>
          memory.write.clear(),
        ),
      setSelectedPath: (path) =>
        recordMemoryOperation({ commandTraceKey, memoryName, operation: "setSelectedPath" }, () =>
          memory.write.setSelectedPath(path),
        ),
      setTree: (tree) =>
        recordMemoryOperation({ commandTraceKey, memoryName, operation: "setTree" }, () =>
          memory.write.setTree(tree),
        ),
      setTreeAndFocusPath: (tree, path) =>
        recordMemoryOperation(
          { commandTraceKey, memoryName, operation: "setTreeAndFocusPath" },
          () => memory.write.setTreeAndFocusPath(tree, path),
        ),
      setTreeAndSelectedPath: (tree, path) =>
        recordMemoryOperation(
          { commandTraceKey, memoryName, operation: "setTreeAndSelectedPath" },
          () => memory.write.setTreeAndSelectedPath(tree, path),
        ),
      setTreeWithoutSelectionRefresh: (tree) =>
        recordMemoryOperation(
          { commandTraceKey, memoryName, operation: "setTreeWithoutSelectionRefresh" },
          () => memory.write.setTreeWithoutSelectionRefresh(tree),
        ),
    },
  };
}
