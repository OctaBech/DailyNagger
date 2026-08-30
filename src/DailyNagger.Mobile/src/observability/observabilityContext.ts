import type { Nagger, TaskEntry, TaskItem, TaskLog } from "@/models";
import { isNagger, isTaskEntry, isTaskItem, isTaskLog } from "@/models";
import type { CommandArgs, CommandKind } from "@/services/command-boundary/commandModel";
import type { Guid } from "@/shared";
import { newGuid } from "@/shared";
import { mergeCausalityKeys } from "./causalityKeyList";

export type Causality = {
  readonly id: Guid;
  readonly key: string;
  readonly kind: string;
  readonly label: string;
  readonly occurredAt: string;
  readonly source: string;
};

export type ObservabilityContext = {
  readonly causality: Causality;
};

export type SpanContinuation = {
  readonly baggage: string | null;
  readonly sentryTrace: string;
};

export type Observability = {
  readonly context: ObservabilityContext;
  readonly causalityKeys: readonly string[];
  readonly spanContinuation: SpanContinuation | null;
};

type BuildObservabilityContextInput = {
  readonly key: string;
  readonly kind: string;
  readonly label: string;
  readonly source: string;
};

export function buildObservabilityContext({
  key,
  kind,
  label,
  source,
}: BuildObservabilityContextInput): ObservabilityContext {
  return {
    causality: {
      id: newGuid(),
      key,
      kind,
      label,
      occurredAt: new Date().toISOString(),
      source,
    },
  };
}

export function recordLegacyObservability(causalityKeys: readonly string[]): Observability {
  const key = causalityKeys[0] ?? "legacy:unknown";

  return {
    context: buildObservabilityContext({
      key,
      kind: "legacy/queued-parcel",
      label: "Legacy queued parcel",
      source: "send-queue",
    }),
    causalityKeys,
    spanContinuation: null,
  };
}

export function mergeObservability(
  primary: Observability,
  secondary: readonly Observability[],
): Observability {
  let causalityKeys = primary.causalityKeys;

  for (const observability of secondary) {
    causalityKeys = mergeCausalityKeys(causalityKeys, observability.causalityKeys);
  }

  return {
    ...primary,
    causalityKeys,
  };
}

export function buildCommandObservabilityContext<TKey extends CommandKind>(
  source: string,
  kind: TKey,
  args: CommandArgs<TKey>,
): ObservabilityContext {
  const key = buildCausalityKey(kind, args);

  return buildObservabilityContext({
    key,
    kind,
    label: kind,
    source,
  });
}

function buildCausalityKey<TKey extends CommandKind>(kind: TKey, args: CommandArgs<TKey>): string {
  const rootKey = buildCausalityRootKey(args);
  if (rootKey === null) {
    throw new Error(`Cannot build causality key for command "${kind}".`);
  }

  const surface = getCommandSurface(kind);
  return surface === null ? rootKey : `${rootKey}/${surface}`;
}

function buildCausalityRootKey(args: unknown): string | null {
  if (!isRecord(args)) return null;

  const moveContextKey =
    "moveContext" in args ? buildSelectedNodeContextKey(args.moveContext) : null;
  if (moveContextKey !== null) return moveContextKey;

  const deleteContextKey =
    "deleteContext" in args ? buildSelectedNodeContextKey(args.deleteContext) : null;
  if (deleteContextKey !== null) return deleteContextKey;

  const taskEntryKey = "taskEntry" in args ? buildTaskEntryKey(args.taskEntry) : null;
  if (taskEntryKey !== null) return taskEntryKey;

  const taskItemKey = "taskItem" in args ? buildTaskItemKey(args.taskItem) : null;
  if (taskItemKey !== null) return taskItemKey;

  const taskLogKey = "taskLog" in args ? buildTaskLogKey(args.taskLog) : null;
  if (taskLogKey !== null) return taskLogKey;

  const naggerKey = "nagger" in args ? buildNaggerKey(args.nagger) : null;
  if (naggerKey !== null) return naggerKey;

  const naggerIdKey = "naggerId" in args ? buildNaggerIdKey(args.naggerId) : null;
  if (naggerIdKey !== null) return naggerIdKey;

  return null;
}

function buildSelectedNodeContextKey(value: unknown): string | null {
  if (!isRecord(value)) return null;
  return buildTaskEntryKey(value.selectedNode) ?? buildTaskItemKey(value.selectedNode);
}

function buildTaskEntryKey(value: unknown): string | null {
  if (!isTreeNode(value) || !isTaskEntry(value)) return null;
  return `task-entry:${value.id}@task-log:${value.taskLogId}`;
}

function buildTaskItemKey(value: unknown): string | null {
  if (!isTreeNode(value) || !isTaskItem(value)) return null;
  return `task-item:${value.id}@task-log:${value.taskLogId}`;
}

function buildTaskLogKey(value: unknown): string | null {
  if (!isTreeNode(value) || !isTaskLog(value)) return null;
  return `task-log:${value.id}`;
}

function buildNaggerKey(value: unknown): string | null {
  if (!isTreeNode(value) || !isNagger(value)) return null;
  return `nagger:${value.id}`;
}

function buildNaggerIdKey(value: unknown): string | null {
  if (value === null) return "nagger:new";
  if (!isGuid(value)) return null;
  return `nagger:${value}`;
}

function getCommandSurface(kind: CommandKind): string | null {
  return kind.split("/").slice(1).join("/") || null;
}

function isTreeNode(value: unknown): value is Nagger | TaskEntry | TaskItem | TaskLog {
  return isRecord(value);
}

function isGuid(value: unknown): value is Guid {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
