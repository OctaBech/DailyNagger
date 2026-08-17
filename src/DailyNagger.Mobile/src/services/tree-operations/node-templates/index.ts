import { createTaskEntry } from "./taskEntryTemplate";
import { createTaskItem } from "./taskItemTemplate";

export const nodeTemplates = {
  createTaskEntry,
  createTaskItem,
} as const;
