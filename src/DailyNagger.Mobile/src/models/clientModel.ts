import type { TaskEntryDto } from "@/api/dto";
import type {
  NagPlanDto as GeneratedNagPlanDto,
  NagPlanNaggerDto as GeneratedNagPlanNaggerDto,
  TaskItemDto as GeneratedTaskItemDto,
  TaskLogDto as GeneratedTaskLogDto,
} from "@api-contracts";
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

export type NagPlanNode<TNagger> = Immutable<
  Omit<GeneratedNagPlanDto, "nags"> & {
    readonly nags: readonly TNagger[];
  }
>;

export type NagPlan = Immutable<NagPlanNode<Nagger> & NagPlanClientModelExtension>;

export type NaggerNode<TTaskLog, TScheduleRule> = Immutable<
  Omit<GeneratedNagPlanNaggerDto, "scheduleRules" | "taskLog"> & {
    readonly scheduleRules: readonly TScheduleRule[];
    readonly taskLog: TTaskLog;
  }
>;

export type Nagger = Immutable<NaggerNode<TaskLog, ScheduleRule> & NaggerClientModelExtension>;

export type TaskLogNode<TTaskItem> = Immutable<
  Omit<GeneratedTaskLogDto, "taskItems"> & {
    readonly taskItems: readonly TTaskItem[];
  }
>;

export type TaskLog = Immutable<TaskLogNode<TaskItem> & TaskLogClientModelExtension>;

export type TaskItemNode<TTaskItem, TTaskEntry> = Immutable<
  Omit<GeneratedTaskItemDto, "taskItems" | "taskEntries"> & {
    readonly taskItems: readonly TTaskItem[];
    readonly taskEntries: readonly TTaskEntry[];
  }
>;

export interface TaskItem extends TaskItemNode<TaskItem, TaskEntry>, TaskItemClientModelExtension {}

export type TaskEntry = Immutable<TaskEntryDto & TaskEntryClientModelExtension>;
