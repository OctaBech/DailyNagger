export const tagTypes = {
  taskLog: "task-log",
  taskItem: "task-item",
  taskEntry: "task-entry",
} as const;

export type TagType = (typeof tagTypes)[keyof typeof tagTypes];
