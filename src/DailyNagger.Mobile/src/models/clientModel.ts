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
import type { Immutable } from "@/shared";

export type NagPlan = Immutable<NagPlanDto<Nagger> & NagPlanClientModelExtension>;

export type Nagger = Immutable<NaggerDto<TaskLog> & NaggerClientModelExtension>;

export type ScheduleRule = Nagger["scheduleRules"][number];

export type TaskLog = Immutable<TaskLogDto<TaskItem> & TaskLogClientModelExtension>;

export interface TaskItem extends TaskItemDto<TaskItem, TaskEntry>, TaskItemClientModelExtension {}

export type TaskEntry = Immutable<TaskEntryDto & TaskEntryClientModelExtension>;
