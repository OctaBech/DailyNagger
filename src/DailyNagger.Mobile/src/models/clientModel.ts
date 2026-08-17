import type {
  NagPlanDto,
  NaggerDto,
  TaskLogDto,
  TaskItemDto,
  TaskEntryDto,
} from "@/api/dto";
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

export interface TaskItem extends TaskItemDto<TaskItem, TaskEntry>, TaskItemClientModelExtension {}

export type TaskEntry = Immutable<TaskEntryDto & TaskEntryClientModelExtension>;
