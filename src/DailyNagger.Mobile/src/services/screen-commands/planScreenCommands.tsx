import type {
  Nagger,
  TaskEntry,
  TaskItem,
  TaskLog,
} from "@/models";
import { createRequiredContext, type Prettify } from "@/shared";
import type { CommandDispatcher } from "@/services/command-boundary";
import { useMemo } from "react";

export type PlanScreenCommands = Prettify<ReturnType<typeof useCreatePlanScreenCommands>>;

export const {
  Provider: PlanScreenCommandsProvider,
  useRequiredContext: usePlanScreenCommands,
} = createRequiredContext<PlanScreenCommands>("PlanScreenCommandsContext");

type UseCreatePlanScreenCommandsProps = {
  readonly decimalSeparator: "." | ",";
  readonly dispatch: CommandDispatcher;
};

export function useCreatePlanScreenCommands({
  decimalSeparator,
  dispatch,
}: UseCreatePlanScreenCommandsProps) {
  return useMemo(
    () => ({
      nagger: {
        setExpanded: (nagger: Nagger, isExpanded: boolean) => {
          dispatch("plan-view", "nagger/set-expanded", { nagger, isExpanded });
        },
        setFocused: (nagger: Nagger) => {
          dispatch("plan-view", "nagger/set-focused", { nagger });
        },
      },
      dial: {
        pinSelectedNagger: () => {
          dispatch("plan-sync", "nagger/pin-selected", {});
        },
        unpinSelectedNagger: () => {
          dispatch("plan-sync", "nagger/unpin-selected", {});
        },
      },
      taskLog: {
        addTaskStep: (taskLog: TaskLog, name: string, rolloverBehavior: TaskItem["rolloverBehavior"]) => {
          dispatch("plan-input", "task-log/add-task-step", { taskLog, name, rolloverBehavior });
        },
        setFocused: (taskLog: TaskLog) => {
          dispatch("plan-view", "task-log/set-focused", { taskLog });
        },
      },
      taskItem: {
        setExpanded: (taskItem: TaskItem, isExpanded: boolean) => {
          dispatch("plan-view", "task-item/set-expanded", { taskItem, isExpanded });
        },
        setFocused: (taskItem: TaskItem) => {
          dispatch("plan-view", "task-item/set-focused", { taskItem });
        },
        setDoneAndSetFocus: (taskItem: TaskItem, isDone: boolean) => {
          dispatch("plan-input", "task-item/set-done-and-set-focus", { taskItem, isDone });
        },
        addQuickNote: (taskItem: TaskItem) => {
          dispatch("plan-input", "task-item/add-quick-note", { taskItem });
        },
        deleteOnce: (taskItem: TaskItem) => {
          dispatch("plan-input", "task-item/delete-once", { taskItem });
        },
      },
      taskEntry: {
        decimalSeparator,
        setFocused: (taskEntry: TaskEntry) => {
          dispatch("plan-view", "task-entry/set-focused", { taskEntry });
        },
        setValue: (taskEntry: TaskEntry, newValue: string | null) => {
          dispatch("plan-input", "task-entry/set-value", { taskEntry, newValue });
        },
      },
    }),
    [decimalSeparator, dispatch],
  );
}
