type TaskItemTree = {
  readonly taskItems: readonly TaskItemTree[];
};

export const treeCountOperations = { countTaskItems } as const;

function countTaskItems(taskItems: readonly TaskItemTree[]): number {
  return taskItems.reduce((total, taskItem) => total + 1 + countTaskItems(taskItem.taskItems), 0);
}
