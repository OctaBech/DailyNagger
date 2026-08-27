import { isNagger, isTaskEntry, isTaskItem, isTaskLog } from "@/models";
import type { Nagger, TaskEntry, TaskItem, TaskLog } from "@/models";
import type { CommandArgs, CommandKind } from "@/services/command-boundary/commandModel";
import type { Guid } from "@/shared";

export type CommandTraceKey = string;

export function buildCommandTraceKey<TKey extends CommandKind>(
  kind: TKey,
  args: CommandArgs<TKey>,
): CommandTraceKey | null {
  const rootKey = buildCommandRootKey(args);
  if (rootKey === null) return null;

  const surface = getCommandSurface(kind);
  return surface === null ? rootKey : `${rootKey}/${surface}`;
}

function buildCommandRootKey(args: unknown): string | null {
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
  return formatTaskEntryKey(value);
}

function buildTaskItemKey(value: unknown): string | null {
  if (!isTreeNode(value) || !isTaskItem(value)) return null;
  return formatTaskItemKey(value);
}

function buildTaskLogKey(value: unknown): string | null {
  if (!isTreeNode(value) || !isTaskLog(value)) return null;
  return formatTaskLogKey(value);
}

function buildNaggerKey(value: unknown): string | null {
  if (!isTreeNode(value) || !isNagger(value)) return null;
  return formatNaggerKey(value);
}

function buildNaggerIdKey(value: unknown): string | null {
  if (value === null) return "nagger:new";
  if (!isGuid(value)) return null;
  return `nagger:${value}`;
}

function getCommandSurface(kind: CommandKind): string | null {
  return kind.split("/").slice(1).join("/") || null;
}

function formatTaskEntryKey(taskEntry: TaskEntry): string {
  return `task-entry:${taskEntry.id}@task-log:${taskEntry.taskLogId}`;
}

function formatTaskItemKey(taskItem: TaskItem): string {
  return `task-item:${taskItem.id}@task-log:${taskItem.taskLogId}`;
}

function formatTaskLogKey(taskLog: TaskLog): string {
  return `task-log:${taskLog.id}`;
}

function formatNaggerKey(nagger: Nagger): string {
  return `nagger:${nagger.id}`;
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
