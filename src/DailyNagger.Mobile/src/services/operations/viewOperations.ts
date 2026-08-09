import type { Nagger, TaskEntry, TaskItem, TaskLog, Tree } from "@/models";
import { treeMutationOperations } from "@/services/core-tree-operations";

export const viewOperations = {
  replaceNaggerViewProps,
  replaceTaskLogViewProps,
  replaceTaskItemViewProps,
  replaceTaskEntryViewProps,
} as const;

function replaceNaggerViewProps(
  tree: Tree,
  nagger: Nagger,
  props: Partial<ClientViewPropsOf<Nagger>>,
) {
  return treeMutationOperations.replaceNagger(tree, nagger, (nagger) =>
    replaceViewProps(nagger, props),
  );
}

function replaceTaskLogViewProps(
  tree: Tree,
  taskLog: TaskLog,
  props: Partial<ClientViewPropsOf<TaskLog>>,
) {
  return treeMutationOperations.replaceTaskLog(tree, taskLog, (taskLog) =>
    replaceViewProps(taskLog, props),
  );
}

function replaceTaskItemViewProps(
  tree: Tree,
  taskItem: TaskItem,
  props: Partial<ClientViewPropsOf<TaskItem>>,
) {
  return treeMutationOperations.replaceTaskItem(tree, taskItem, (taskItem) =>
    replaceViewProps(taskItem, props),
  );
}

function replaceTaskEntryViewProps(
  tree: Tree,
  taskEntry: TaskEntry,
  props: Partial<ClientViewPropsOf<TaskEntry>>,
) {
  return treeMutationOperations.replaceTaskEntry(tree, taskEntry, (taskEntry) =>
    replaceViewProps(taskEntry, props),
  );
}

type ClientViewPropsOf<TModel> = TModel extends { clientProps?: infer TProps }
  ? NonNullable<TProps>
  : never;

function replaceViewProps<TModel extends { readonly clientProps?: object }>(
  model: TModel,
  props: Partial<ClientViewPropsOf<TModel>>,
): TModel {
  return {
    ...model,
    clientProps: {
      ...model.clientProps,
      ...props,
    },
  };
}
