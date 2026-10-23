import type * as ReactNative from "react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { SheetNarrowPicker } from "@/components/modal/SheetNarrowPicker";

jest.mock("@/components/modal/SheetSearchInput", () => ({ SheetSearchInput: () => null }));
jest.mock("@/components/modal/SheetNarrowControls", () => ({
  SheetNarrowControls: ({ sort }: { sort: React.ReactNode }) => sort,
}));
jest.mock("@/components/modal/SheetSegmentedControl", () => {
  const { Pressable, Text } = jest.requireActual<typeof ReactNative>("react-native");
  return {
    SheetSegmentedControl: ({
      options,
      onChange,
    }: {
      options: readonly { label: string; value: string }[];
      onChange: (value: string) => void;
    }) =>
      options.map((option) => (
        <Pressable key={option.value} onPress={() => onChange(option.value)}>
          <Text>{option.label}</Text>
        </Pressable>
      )),
  };
});

const options = [
  { label: "Alpha holiday", value: "hidden-alpha-id", date: "2026-12-25" },
  { label: "Zulu holiday", value: "hidden-zulu-id", date: "2026-11-01" },
];

describe("picker highlighted value", () => {
  it("follows the displayed date/A-Z order, search and empty results", async () => {
    const onValue = jest.fn();
    const props = {
      options,
      highlightMode: "closest-match" as const,
      onPick: jest.fn(),
      onHighlightedValueChange: onValue,
      sortOptions: [
        { label: "Date", value: "date" as const },
        { label: "A-Z", value: "alphabetical" as const },
      ],
    };
    const screen = await render(<SheetNarrowPicker {...props} value="" />);
    expect(onValue).toHaveBeenLastCalledWith("hidden-zulu-id");
    expect(screen.getAllByText(/ holiday$/)[0].props.children).toBe("Zulu holiday");
    await fireEvent.press(screen.getByText("A-Z"));
    expect(onValue).toHaveBeenLastCalledWith("hidden-alpha-id");
    expect(screen.getAllByText(/ holiday$/)[0].props.children).toBe("Alpha holiday");
    await screen.rerender(<SheetNarrowPicker {...props} value="Zulu" />);
    expect(onValue).toHaveBeenLastCalledWith("hidden-zulu-id");
    await screen.rerender(<SheetNarrowPicker {...props} value="no matches" />);
    expect(onValue).toHaveBeenLastCalledWith(null);
    await screen.unmount();
  });
});

it("preserves explicit picking of object values without a highlighted-value callback", async () => {
  const tag = { name: "Training", description: "Exercise notes" };
  const onPick = jest.fn();
  const option = { label: tag.name, value: tag, date: "2026-10-23" };
  const props = { options: [option], onPick };
  const screen = await render(<SheetNarrowPicker {...props} value="Tra" />);
  expect(onPick).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText("Training"));
  expect(onPick).toHaveBeenCalledWith(option);
  await screen.rerender(<SheetNarrowPicker {...props} value="A new name" />);
  expect(screen.getByText("No matches.")).toBeTruthy();
  expect(onPick).toHaveBeenCalledTimes(1);
  await screen.unmount();
});
