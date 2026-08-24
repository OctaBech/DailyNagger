import type { components, operations, paths } from "./schema";

type Immutable<T> = {
  readonly [TKey in keyof T]: T[TKey];
} & {};

export type ApiComponents = components;
export type ApiOperations = operations;
export type ApiPaths = paths;

export type NagPlanDto = components["schemas"]["NagPlanDto"];
export type NaggerDto = components["schemas"]["NaggerDto"];
export type NagPlanNaggerDto = components["schemas"]["NagPlanNaggerDto"];
export type ScheduleRuleDto = components["schemas"]["ScheduleRuleDto"];
export type TaskEntryDto = components["schemas"]["TaskEntryDto"];
type GeneratedTaskItemDto = components["schemas"]["TaskItemDto"];
type GeneratedTaskLogDto = components["schemas"]["TaskLogDto"];
export interface TaskItemDto
  extends Immutable<
    Omit<GeneratedTaskItemDto, "taskItems" | "taskEntries"> & {
      readonly taskItems: readonly TaskItemDto[];
      readonly taskEntries: readonly TaskEntryDto[];
    }
  > {}
export type TaskLogDto = Immutable<
  Omit<GeneratedTaskLogDto, "taskItems"> & {
    readonly taskItems: readonly TaskItemDto[];
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
