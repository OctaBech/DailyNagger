import { type Guid } from "@/shared";

export type TaskEntryValueType = "Text" | "Integer" | "Decimal" | "Boolean";
export type NaggerPinnedBy = "None" | "User" | "Llm" | "Community";

export type ScheduleRuleType = "Weekday" | "Date" | "Holiday";

export type NagPlanDto<TNagger = NaggerDto> = {
  readonly date: string;
  readonly nags: readonly TNagger[];
};

export type NaggerDto<TTaskLog = TaskLogDto> = {
  readonly id: Guid;
  readonly title: string;
  readonly updatedAt: string;
  readonly updatedByClientId: string | null;
  readonly updatedByDeviceName: string | null;
  readonly updatedByDeviceModel: string | null;
  readonly activeLogDueOn: string | null;
  readonly expiresOn: string | null;
  readonly targetTime: string | null;
  readonly isDeactivated: boolean;
  readonly pinnedBy: NaggerPinnedBy;
  readonly scheduleRules: readonly ScheduleRuleDto[];
  readonly taskLog: TTaskLog;
  readonly version: number;
};

export type ScheduleRuleDto = {
  readonly id: Guid;
  readonly ruleType: ScheduleRuleType;
  readonly ruleJson: string;
};

export type TaskLogVersionDto = {
  readonly version: number;
  readonly updatedAt: string;
};

export type VersionedResponseDto = {
  readonly version: number;
  readonly updatedAt?: string;
};

export type ClientIdentityDto = {
  readonly clientId: string;
  readonly deviceName: string;
  readonly deviceModel: string;
};

export type TaskLogDto<TTaskItem = TaskItemDto> = {
  readonly id: Guid;
  readonly nagId: Guid;
  readonly copiedFromTaskLogId: Guid | null;
  readonly closedOn: string | null;
  readonly tag: string | null;
  readonly updatedAt: string;
  readonly updatedByClientId: string | null;
  readonly updatedByDeviceName: string | null;
  readonly updatedByDeviceModel: string | null;
  readonly version: number;
  readonly descendantTaskItemCount: number;
  readonly doneDescendantTaskItemCount: number;
  readonly taskItems: readonly TTaskItem[];
};

export interface TaskItemDto<TTaskItem = RecursiveTaskItemDto, TTaskEntry = TaskEntryDto> {
  readonly id: Guid;
  readonly taskLogId: Guid;
  readonly parentTaskItemId: Guid | null;
  readonly name: string;
  readonly tag: string | null;
  readonly isDone: boolean;
  readonly rolloverBehavior: "Keep" | "RemoveWhenDone";
  readonly interactionAt: string | null;
  readonly interactionTimeZone: string | null;
  readonly interactionLocale: string | null;
  readonly interactionMood: string | null;
  readonly interactionMoodAt: string | null;
  readonly descendantTaskItemCount: number;
  readonly doneDescendantTaskItemCount: number;
  readonly taskEntries: readonly TTaskEntry[];
  readonly taskItems: readonly TTaskItem[];
}

type RecursiveTaskItemDto = TaskItemDto<RecursiveTaskItemDto, TaskEntryDto>;

export type TaskEntryDto = {
  readonly id: Guid;
  readonly taskLogId: Guid;
  readonly parentTaskItemId: Guid;
  readonly label: string;
  readonly description: string | null;
  readonly valueType: TaskEntryValueType;
  readonly tag: string | null;
  readonly value: string | null;
  readonly lastTaskRunReferenceValue: string | null;
  readonly rolloverBehavior: "MoveValueToHistory" | "CarryOverValue" | "Remove";
  readonly interactionAt: string | null;
  readonly interactionTimeZone: string | null;
  readonly interactionLocale: string | null;
  readonly interactionMood: string | null;
  readonly interactionMoodAt: string | null;
};

export type TaskEntryValueUpdateDto = {
  readonly id: Guid;
  readonly value: string | null;
  readonly interactionAt: string | null;
  readonly interactionTimeZone: string | null;
  readonly interactionLocale: string | null;
  readonly interactionMood: string | null;
  readonly interactionMoodAt: string | null;
};

export type DtoNode = NagPlanDto | NaggerDto | TaskLogDto | TaskItemDto | TaskEntryDto;
