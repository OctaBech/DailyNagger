import type { Immutable } from "@/shared";

export type ClientNodeType = "NagPlan" | "Nagger" | "TaskLog" | "TaskItem" | "TaskEntry";

export type ClientModel<TClientViewProps, TNodeType extends ClientNodeType> = Immutable<{
  readonly nodeType: TNodeType;
  readonly clientProps: TClientViewProps & ClientSharedProps;
}>;

export type ClientSharedProps = Immutable<{
  readonly isSelected: boolean;
  readonly hasFocus: boolean;
  readonly isFocusParent: boolean;
  readonly indexHint: number;
}>;

export const nagPlanClientModelExtensionDefaults: ClientModel<
  {
    readonly isShowingPinnedTasks: boolean;
  },
  "NagPlan"
> = {
  nodeType: "NagPlan",
  clientProps: {
    isSelected: false,
    hasFocus: false,
    isFocusParent: false,
    indexHint: 0,
    isShowingPinnedTasks: false,
  },
};

export const naggerClientModelExtensionDefaults: ClientModel<
  {
    readonly isExpanded: boolean;
  },
  "Nagger"
> = {
  nodeType: "Nagger",
  clientProps: {
    isSelected: false,
    hasFocus: false,
    isFocusParent: false,
    indexHint: 0,
    isExpanded: false,
  },
};

export const taskLogClientModelExtensionDefaults: ClientModel<
  {
    readonly isExpanded: boolean;
  },
  "TaskLog"
> = {
  nodeType: "TaskLog",
  clientProps: {
    isSelected: false,
    hasFocus: false,
    isFocusParent: false,
    indexHint: 0,
    isExpanded: false,
  },
};

export const taskItemClientModelExtensionDefaults: ClientModel<
  {
    readonly isExpanded: boolean;
  },
  "TaskItem"
> = {
  nodeType: "TaskItem",
  clientProps: {
    isSelected: false,
    hasFocus: false,
    isFocusParent: false,
    indexHint: 0,
    isExpanded: false,
  },
};

export const taskEntryClientModelExtensionDefaults: ClientModel<
  {
    readonly isVisible: boolean;
  },
  "TaskEntry"
> = {
  nodeType: "TaskEntry",
  clientProps: {
    isSelected: false,
    hasFocus: false,
    isFocusParent: false,
    indexHint: 0,
    isVisible: true,
  },
};

export type NagPlanClientViewProps = Immutable<
  Omit<typeof nagPlanClientModelExtensionDefaults.clientProps, keyof ClientSharedProps>
>;

export type NagPlanClientModelExtension = Immutable<typeof nagPlanClientModelExtensionDefaults>;

export type NaggerClientViewProps = Immutable<
  Omit<typeof naggerClientModelExtensionDefaults.clientProps, keyof ClientSharedProps>
>;

export type NaggerClientModelExtension = Immutable<typeof naggerClientModelExtensionDefaults>;

export type TaskLogClientViewProps = Immutable<
  Omit<typeof taskLogClientModelExtensionDefaults.clientProps, keyof ClientSharedProps>
>;

export type TaskLogClientModelExtension = Immutable<typeof taskLogClientModelExtensionDefaults>;

export type TaskItemClientViewProps = Immutable<
  Omit<typeof taskItemClientModelExtensionDefaults.clientProps, keyof ClientSharedProps>
>;

export type TaskItemClientModelExtension = Immutable<typeof taskItemClientModelExtensionDefaults>;

export type TaskEntryClientViewProps = Immutable<
  Omit<typeof taskEntryClientModelExtensionDefaults.clientProps, keyof ClientSharedProps>
>;

export type TaskEntryClientModelExtension = Immutable<typeof taskEntryClientModelExtensionDefaults>;
