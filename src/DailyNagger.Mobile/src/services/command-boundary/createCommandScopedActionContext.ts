import { createCommandScopedMemory, type CommandTraceKey } from "@/observability";
import type {
  CommandActionContext,
  CommandEditorActionContext,
  CommandEditorSessionActionContext,
  CommandInputActionContext,
  CommandSyncActionContext,
  CommandViewActionContext,
} from "./commandActions";
import type { CommandSource } from "./useCommandDispatcher";
import type { Memory } from "@/services/contracts";

export function createCommandScopedActionContext(
  source: CommandSource,
  context: CommandActionContext,
  commandTraceKey: CommandTraceKey | null,
): CommandActionContext {
  if (commandTraceKey === null) return context;

  switch (source) {
    case "plan-input":
    case "plan-sync":
    case "plan-view":
      return decorateMemoryContext(
        context as CommandInputActionContext | CommandSyncActionContext | CommandViewActionContext,
        "planMemory",
        commandTraceKey,
      );

    case "editor-action":
    case "editor-input":
    case "editor-sync":
    case "editor-view":
      return decorateMemoryContext(
        context as
          | CommandEditorActionContext
          | CommandInputActionContext
          | CommandSyncActionContext
          | CommandViewActionContext,
        "editorMemory",
        commandTraceKey,
      );

    case "editor-session":
      return decorateEditorSessionContext(
        context as CommandEditorSessionActionContext,
        commandTraceKey,
      );
  }
}

function decorateMemoryContext<TContext extends { readonly memory: Memory }>(
  context: TContext,
  memoryName: string,
  commandTraceKey: CommandTraceKey,
): TContext {
  return {
    ...context,
    memory: createCommandScopedMemory({ commandTraceKey, memory: context.memory, memoryName }),
  };
}

function decorateEditorSessionContext(
  context: CommandEditorSessionActionContext,
  commandTraceKey: CommandTraceKey,
): CommandEditorSessionActionContext {
  return {
    ...context,
    editorMemory: createCommandScopedMemory({
      commandTraceKey,
      memory: context.editorMemory,
      memoryName: "editorMemory",
    }),
    planMemory: createCommandScopedMemory({
      commandTraceKey,
      memory: context.planMemory,
      memoryName: "planMemory",
    }),
  };
}
