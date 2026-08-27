import { useStableCallback } from "@/shared";
import { buildCommandTraceKey, recordCommandOperation } from "@/observability";
import type { CultureSettings, InteractionStamp, Memory } from "@/services/contracts";
import type { Sending } from "../sending";
import {
  commandActions,
  type CommandActionContext,
  type CommandEditorActionContext,
  type CommandEditorSessionActionContext,
  type CommandInputActionContext,
  type CommandScope,
  type CommandSyncActionContext,
  type CommandViewActionContext,
  type ContextForScope,
  type SourceForScope,
} from "./commandActions";
import type { CommandArgs, CommandKind, CommandScopeForKind } from "./commandModel";

export type CommandSource =
  | "plan-input"
  | "plan-sync"
  | "plan-view"
  | "editor-action"
  | "editor-input"
  | "editor-sync"
  | "editor-view"
  | "editor-session";

type CommandMemories = {
  readonly cultureSettings: CultureSettings;
  readonly planMemory: Memory;
  readonly editorMemory: Memory;
  readonly planInteractionStamp: InteractionStamp;
  readonly sending: Sending;
};

export type CommandDispatcher = <TKey extends CommandKind>(
  source: SourceForScope<CommandScopeForKind<TKey>>,
  kind: TKey,
  args: CommandArgs<TKey>,
) => void;

export function useCommandDispatcher(memories: CommandMemories): CommandDispatcher {
  return useStableCallback(
    <TKey extends CommandKind>(
      source: SourceForScope<CommandScopeForKind<TKey>>,
      kind: TKey,
      args: CommandArgs<TKey>,
    ): void => {
      runCommand(source, kind, args, getCommandActionContext(source, memories));
    },
  );
}

function getCommandActionContext(
  source: CommandSource,
  memories: CommandMemories,
): CommandActionContext {
  switch (source) {
    case "plan-view":
      return { memory: memories.planMemory } satisfies CommandViewActionContext;

    case "plan-input":
      return {
        cultureSettings: memories.cultureSettings,
        memory: memories.planMemory,
        sending: memories.sending,
        interactionStamp: memories.planInteractionStamp,
      } satisfies CommandInputActionContext;

    case "plan-sync":
      return {
        memory: memories.planMemory,
        sending: memories.sending,
      } satisfies CommandSyncActionContext;

    case "editor-action":
      return { memory: memories.editorMemory } satisfies CommandEditorActionContext;

    case "editor-view":
      return { memory: memories.editorMemory } satisfies CommandViewActionContext;

    case "editor-input":
      return {
        cultureSettings: memories.cultureSettings,
        memory: memories.editorMemory,
        sending: memories.sending,
        interactionStamp: null,
      } satisfies CommandInputActionContext;

    case "editor-sync":
      return {
        memory: memories.editorMemory,
        sending: memories.sending,
      } satisfies CommandSyncActionContext;

    case "editor-session":
      return {
        editorMemory: memories.editorMemory,
        planMemory: memories.planMemory,
        sending: memories.sending,
      } satisfies CommandEditorSessionActionContext;
  }
}

function runCommand<TKey extends CommandKind>(
  source: CommandSource,
  kind: TKey,
  args: CommandArgs<TKey>,
  context: CommandActionContext,
): void {
  const commandTraceKey = buildCommandTraceKey(kind, args);

  recordCommandOperation({ commandKind: kind, commandSource: source, commandTraceKey }, () => {
    const action = commandActions[kind];

    assertSourceMatchesScope(source, action.scope);
    assertContextMatchesScope(context, action.scope);

    const run = action.run as (
      args: CommandArgs<TKey>,
      context: ContextForScope<CommandScopeForKind<TKey>>,
    ) => void;

    run(args, context as ContextForScope<CommandScopeForKind<TKey>>);
  });
}

function assertSourceMatchesScope<TScope extends CommandScope>(
  source: CommandSource,
  scope: TScope,
): asserts source is SourceForScope<TScope> {
  if (getSourceScope(source) !== scope) {
    throw new Error(`Command source "${source}" cannot run "${scope}" commands.`);
  }
}

function assertContextMatchesScope<TScope extends CommandScope>(
  context: CommandActionContext,
  scope: TScope,
): asserts context is ContextForScope<TScope> {
  if (!contextMatchesScope(context, scope)) {
    throw new Error(`Command context cannot run "${scope}" commands.`);
  }
}

function getSourceScope(source: CommandSource): CommandScope {
  switch (source) {
    case "editor-view":
    case "plan-view":
      return "view";

    case "editor-input":
    case "plan-input":
      return "input";

    case "editor-sync":
    case "plan-sync":
      return "sync";

    case "editor-action":
      return "editor-action";

    case "editor-session":
      return "editor-session";
  }
}

function contextMatchesScope(context: CommandActionContext, scope: CommandScope): boolean {
  switch (scope) {
    case "view":
      return "memory" in context && !("sending" in context);

    case "input":
      return "memory" in context && "sending" in context && "cultureSettings" in context;

    case "sync":
      return "memory" in context && "sending" in context && !("cultureSettings" in context);

    case "editor-action":
      return "memory" in context && !("sending" in context);

    case "editor-session":
      return "editorMemory" in context && "planMemory" in context && "sending" in context;
  }
}
