import { describe, expect, it, jest } from "@jest/globals";
import type { TaskEntry, TaskItem, TaskLog } from "@/models/clientModel";
import {
  taskEntryClientModelExtensionDefaults,
  taskItemClientModelExtensionDefaults,
  taskLogClientModelExtensionDefaults,
} from "@/models/clientModelExtensions";
import { rollover } from "@/services/tree-operations/rollover";

jest.mock("uuid", () => {
  let sequence = 0;
  return { v7: () => `new-id-${++sequence}` };
});

function item(
  id: string,
  parentTaskItemId: string | null,
  taskItems: readonly TaskItem[],
  taskEntries: readonly TaskEntry[],
): TaskItem {
  return {
    ...taskItemClientModelExtensionDefaults,
    id,
    parentTaskItemId,
    taskLogId: "old-log",
    taskItems,
    taskEntries,
    isDone: false,
    rolloverBehavior: "Keep",
    clientProps: { ...taskItemClientModelExtensionDefaults.clientProps, isExpanded: true },
  } as TaskItem;
}

describe("rollover expansion state", () => {
  it("collapses the new log and nested items while preserving entry visibility and the source", () => {
    const entry = {
      ...taskEntryClientModelExtensionDefaults,
      id: "entry",
      parentTaskItemId: "child",
      taskLogId: "old-log",
      value: "12",
      rolloverBehavior: "CarryOverValue",
    } as TaskEntry;
    const child = item("child", "root", [], [entry]);
    const root = item("root", null, [child], []);
    const source = {
      ...taskLogClientModelExtensionDefaults,
      id: "old-log",
      nagId: "nagger",
      tag: null,
      copiedFromTaskLogId: null,
      closedOn: null,
      version: 0,
      updatedAt: "2026-10-25T12:00:00Z",
      updatedByClientId: null,
      updatedByDeviceName: null,
      updatedByDeviceModel: null,
      descendantTaskItemCount: 2,
      doneDescendantTaskItemCount: 0,
      taskItems: [root],
      clientProps: { ...taskLogClientModelExtensionDefaults.clientProps, isExpanded: true },
    } as TaskLog;

    const next = rollover.createTaskLog(source);
    expect(next.clientProps.isExpanded).toBe(false);
    expect(next.taskItems[0].clientProps.isExpanded).toBe(false);
    expect(next.taskItems[0].taskItems[0].clientProps.isExpanded).toBe(false);
    const nextEntry = next.taskItems[0].taskItems[0].taskEntries[0];
    expect(nextEntry.clientProps.isVisible).toBe(true);
    expect(nextEntry.value).toBe("12");
    expect(source.clientProps.isExpanded).toBe(true);
    expect(root.clientProps.isExpanded).toBe(true);
    expect(child.clientProps.isExpanded).toBe(true);
    expect(entry.clientProps.isVisible).toBe(true);
  });
});
