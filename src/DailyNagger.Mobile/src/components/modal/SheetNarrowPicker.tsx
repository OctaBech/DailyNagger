import { useMemo, useState } from "react";
import type { Ref } from "react";
import type { TextInput, TextInputProps } from "react-native";
import {
  SheetNarrowChips,
  type SheetNarrowChipOption,
  type SheetNarrowChipSortMode,
} from "./SheetNarrowChips";
import { SheetSearchInput } from "./SheetSearchInput";
import { SheetSegmentedControl } from "./SheetSegmentedControl";
import { SheetNarrowControls } from "./SheetNarrowControls";

type SheetNarrowPickerProps<TValue> = Omit<TextInputProps, "style"> & {
  readonly edgeToEdge?: boolean;
  readonly emptyText?: string;
  readonly highlightMode?: "closest-match" | "exact-match";
  readonly inputRef?: Ref<TextInput>;
  readonly isLoading?: boolean;
  readonly loadErrorText?: string | null;
  readonly loadingText?: string;
  readonly onClear?: () => void;
  readonly onPick: (option: SheetNarrowChipOption<TValue>) => void;
  readonly options: readonly SheetNarrowChipOption<TValue>[];
  readonly sortOptions?: readonly SheetNarrowPickerSortOption[];
};

type SheetNarrowPickerSortOption = {
  readonly label: string;
  readonly value: SheetNarrowChipSortMode;
};

const defaultSortOptions: readonly SheetNarrowPickerSortOption[] = [
  { label: "Recent", value: "date" },
  { label: "A-Z", value: "alphabetical" },
];

export function SheetNarrowPicker<TValue>({
  edgeToEdge = false,
  emptyText,
  highlightMode,
  inputRef,
  isLoading,
  loadErrorText,
  loadingText,
  onClear,
  onPick,
  options,
  sortOptions = defaultSortOptions,
  value,
  ...textInputProps
}: SheetNarrowPickerProps<TValue>) {
  const [sortMode, setSortMode] = useState<SheetNarrowChipSortMode>(sortOptions[0]?.value ?? "date");
  const activeSortMode = sortOptions.some((option) => option.value === sortMode)
    ? sortMode
    : (sortOptions[0]?.value ?? "date");
  const inputText = `${value ?? ""}`;

  const hasExactMatch = useMemo(() => {
    const normalizedInput = inputText.trim().toLocaleLowerCase();
    if (normalizedInput === "") return false;

    return options.some((option) => option.label.toLocaleLowerCase() === normalizedInput);
  }, [inputText, options]);

  return (
    <>
      <SheetNarrowControls
        search={
          <SheetSearchInput
            ref={inputRef}
            value={value}
            onClear={onClear}
            hasExactMatch={hasExactMatch}
            {...textInputProps}
          />
        }
        sort={
          <SheetSegmentedControl
            options={sortOptions}
            value={activeSortMode}
            onChange={setSortMode}
          />
        }
      />

      <SheetNarrowChips
        edgeToEdge={edgeToEdge}
        emptyText={emptyText}
        inputText={inputText}
        isLoading={isLoading}
        loadingText={loadingText}
        loadErrorText={loadErrorText}
        highlightMode={highlightMode}
        onPick={onPick}
        options={options}
        sortMode={activeSortMode}
      />
    </>
  );
}
