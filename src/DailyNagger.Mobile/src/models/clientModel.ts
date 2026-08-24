import type { NagPlanDto, NaggerDto, TaskLogDto, TaskEntryDto } from "@/api/dto";
import type { TaskItemDto as GeneratedTaskItemDto } from "@api-contracts";
import type {
  NaggerClientModelExtension,
  NagPlanClientModelExtension,
  TaskEntryClientModelExtension,
  TaskItemClientModelExtension,
  TaskLogClientModelExtension,
} from "./clientModelExtensions";
import type { ScheduleRule as ScheduleRuleModel } from "./scheduleRules";
import type { Immutable } from "@/shared";

export type ScheduleRule = ScheduleRuleModel;

export type NagPlan = Immutable<NagPlanDto<Nagger> & NagPlanClientModelExtension>;

export type Nagger = Immutable<
  Omit<NaggerDto<TaskLog>, "scheduleRules"> & {
    readonly scheduleRules: readonly ScheduleRule[];
  } & NaggerClientModelExtension
>;

export type TaskLog = Immutable<TaskLogDto<TaskItem> & TaskLogClientModelExtension>;

export type TaskItemNode<TTaskItem, TTaskEntry> = Immutable<
  Omit<GeneratedTaskItemDto, "taskItems" | "taskEntries"> & {
    readonly taskItems: readonly TTaskItem[];
    readonly taskEntries: readonly TTaskEntry[];
  }
>;

export interface TaskItem extends TaskItemNode<TaskItem, TaskEntry>, TaskItemClientModelExtension {}

export type TaskEntry = Immutable<TaskEntryDto & TaskEntryClientModelExtension>;
