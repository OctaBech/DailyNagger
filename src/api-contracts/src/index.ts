import type { components, operations, paths } from "./schema";

type Immutable<T> = {
  readonly [TKey in keyof T]: T[TKey];
} & {};

export type ApiComponents = components;
export type ApiOperations = operations;
export type ApiPaths = paths;

export type NaggerDto = components["schemas"]["NaggerDto"];
export type ScheduleRuleDto = components["schemas"]["ScheduleRuleDto"];
type GeneratedNagPlanDto = components["schemas"]["NagPlanDto"];
type GeneratedNagPlanNaggerDto = components["schemas"]["NagPlanNaggerDto"];
type GeneratedTaskEntryDto = components["schemas"]["TaskEntryDto"];
type GeneratedTaskItemDto = components["schemas"]["TaskItemDto"];
type GeneratedTaskLogDto = components["schemas"]["TaskLogDto"];
export type TaskEntryDto = Immutable<
  Omit<GeneratedTaskEntryDto, "rolloverBehavior"> & {
    readonly rolloverBehavior: "MoveValueToHistory" | "CarryOverValue" | "Remove";
  }
>;
export interface TaskItemDto
  extends Immutable<
    Omit<GeneratedTaskItemDto, "taskItems" | "taskEntries" | "rolloverBehavior"> & {
      readonly rolloverBehavior: "Keep" | "RemoveWhenDone";
      readonly taskItems: readonly TaskItemDto[];
      readonly taskEntries: readonly TaskEntryDto[];
    }
  > {}
export type TaskLogDto = Immutable<
  Omit<GeneratedTaskLogDto, "taskItems"> & {
    readonly taskItems: readonly TaskItemDto[];
  }
>;
export type NagPlanNaggerDto = Immutable<
  Omit<GeneratedNagPlanNaggerDto, "scheduleRules" | "taskLog"> & {
    readonly scheduleRules: readonly ScheduleRuleDto[];
    readonly taskLog: TaskLogDto;
  }
>;
export type NagPlanDto = Immutable<
  Omit<GeneratedNagPlanDto, "nags"> & {
    readonly nags: readonly NagPlanNaggerDto[];
  }
>;
export type TaskEntryValueUpdateDto = components["schemas"]["TaskEntryValueUpdateDto"];
export type TaskLogVersionDto = components["schemas"]["TaskLogVersionDto"];
export type ClientIdentityDto = components["schemas"]["ClientIdentityDto"];
export type TagDto = components["schemas"]["TagDto"];
export type TaskStepNameSuggestionDto = components["schemas"]["TaskStepNameSuggestionDto"];

export type NaggerPinnedByDto = components["schemas"]["NaggerPinnedByDto"];
export type ScheduleRuleTypeDto = components["schemas"]["ScheduleRuleTypeDto"];
export type RolloverBehaviorDto = components["schemas"]["RolloverBehaviorDto"];
export type TaskEntryValueTypeDto = components["schemas"]["TaskEntryValueTypeDto"];

export type NaggerPinnedBy = NaggerPinnedByDto;
export type ScheduleRuleType = ScheduleRuleTypeDto;
export type TaskEntryValueType = TaskEntryValueTypeDto;
