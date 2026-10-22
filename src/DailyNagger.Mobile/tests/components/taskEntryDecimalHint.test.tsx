import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { TaskEntry } from "@/models/clientModel";
import { TaskEntryValueInput } from "@/components/input/TaskEntryValueInput";

jest.mock("@/config", () => jest.requireActual("@/config/appTiming"));

jest.mock("uuid", () => ({ v7: () => "unused-test-id" }));

describe("historical decimal hints", () => {
  it.each([
    ["82", "82,0"],
    ["82.4", "82,4"],
    ["82.400", "82,400"],
    ["82.000", "82,000"],
    ["82.", "82,0"],
    ["-82", "-82,0"],
    ["previous text", "previous text"],
    ["1e3", "1e3"],
    [null, "0,0"],
  ])("formats %s without changing or committing the current value", async (reference, hint) => {
    const taskEntry = {
      id: "entry",
      valueType: "Decimal",
      value: "12.50",
      lastTaskRunReferenceValue: reference,
    } as TaskEntry;
    const onCommit = jest.fn();
    const { getByPlaceholderText, unmount } = await render(
      <TaskEntryValueInput
        taskEntry={taskEntry}
        editable
        decimalSeparator=","
        onCommit={onCommit}
        onFocus={() => {}}
        style={{}}
      />,
    );
    expect(getByPlaceholderText(hint!).props.value).toBe("12,50");
    expect(taskEntry.value).toBe("12.50");
    expect(taskEntry.lastTaskRunReferenceValue).toBe(reference);
    expect(onCommit).not.toHaveBeenCalled();
    await unmount();
  });
});
