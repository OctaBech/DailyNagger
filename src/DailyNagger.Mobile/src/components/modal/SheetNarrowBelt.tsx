import { useEffect, useMemo, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { modalTheme } from "./theme";

export type SheetNarrowBeltSortMode = "alphabetical" | "date";
export type SheetNarrowHighlightMode = "closest-match" | "exact-match";

export type SheetNarrowBeltOption<TValue> = {
  readonly date?: string | null;
  readonly description?: string | null;
  readonly label: string;
  readonly value: TValue;
};

type SheetNarrowBeltProps<TValue> = {
  readonly edgeToEdge?: boolean;
  readonly emptyText?: string;
  readonly inputText: string;
  readonly isLoading?: boolean;
  readonly loadErrorText?: string | null;
  readonly loadingText?: string;
  readonly highlightMode?: SheetNarrowHighlightMode;
  readonly onPick: (option: SheetNarrowBeltOption<TValue>) => void;
  readonly options: readonly SheetNarrowBeltOption<TValue>[];
  readonly sortMode?: SheetNarrowBeltSortMode;
};

export function SheetNarrowBelt<TValue>({
  edgeToEdge = false,
  emptyText = "No matches.",
  inputText,
  isLoading = false,
  loadErrorText = null,
  loadingText = "Loading...",
  highlightMode = "exact-match",
  onPick,
  options,
  sortMode = "alphabetical",
}: SheetNarrowBeltProps<TValue>) {
  const listRef = useRef<FlatList<SheetNarrowBeltOption<TValue>>>(null);

  const visibleOptions = useMemo(() => {
    const trimmedInput = inputText.trim();
    const normalizedInput = trimmedInput.toLocaleLowerCase();

    const matchingOptions =
      normalizedInput === ""
        ? options
        : options.filter((option) =>
            `${option.label} ${option.description ?? ""}`
              .toLocaleLowerCase()
              .includes(normalizedInput),
          );

    const sortedOptions = [...matchingOptions].sort((left, right) => {
      if (sortMode === "date") {
        return compareNullableDate(left.date, right.date) || compareLabel(left.label, right.label);
      }

      return compareLabel(left.label, right.label);
    });

    const exactCaseMatchIndex = sortedOptions.findIndex((option) => option.label === trimmedInput);
    if (exactCaseMatchIndex > 0) return moveIndexToFront(sortedOptions, exactCaseMatchIndex);

    const exactTextMatchIndex = sortedOptions.findIndex(
      (option) => option.label.toLocaleLowerCase() === normalizedInput,
    );
    if (exactTextMatchIndex > 0) return moveIndexToFront(sortedOptions, exactTextMatchIndex);

    return sortedOptions;
  }, [inputText, options, sortMode]);

  const trimmedInput = inputText.trim();
  const normalizedInput = trimmedInput.toLocaleLowerCase();

  useEffect(() => {
    listRef.current?.scrollToOffset({ animated: false, offset: 0 });
  }, [inputText, sortMode, visibleOptions]);

  return (
    <View style={styles.container}>
      {isLoading && <Text style={styles.status}>{loadingText}</Text>}

      {loadErrorText !== null && <Text style={styles.status}>{loadErrorText}</Text>}

      {!isLoading && loadErrorText === null && (
        <FlatList
          ref={listRef}
          data={visibleOptions}
          horizontal
          keyExtractor={(option) => `${option.value}`}
          keyboardShouldPersistTaps="handled"
          showsHorizontalScrollIndicator={false}
          style={[styles.list, edgeToEdge && styles.edgeToEdgeList]}
          contentContainerStyle={[styles.belt, edgeToEdge && styles.edgeToEdgeBelt]}
          ListEmptyComponent={<Text style={styles.status}>{emptyText}</Text>}
          ListFooterComponent={
            visibleOptions.length > 0 ? <Text style={styles.divider}>|</Text> : null
          }
          renderItem={({ item, index }) => {
            const isExactCaseMatch = trimmedInput !== "" && item.label === trimmedInput;
            const isExactTextMatch =
              !isExactCaseMatch &&
              normalizedInput !== "" &&
              item.label.toLocaleLowerCase() === normalizedInput;
            const isClosestMatch = highlightMode === "closest-match" && index === 0;
            const isExactMatch = highlightMode === "exact-match" && isExactCaseMatch;
            const isSoftExactMatch = highlightMode === "exact-match" && isExactTextMatch;

            return (
              <View style={styles.resultGroup}>
                <Text style={styles.divider}>|</Text>
                <Pressable
                  onPress={() => onPick(item)}
                  style={({ pressed }) => [styles.result, pressed && styles.pressed]}
                >
                  <Text
                    numberOfLines={1}
                    selectable={false}
                    style={[
                      styles.resultText,
                      isClosestMatch && styles.closestResultText,
                      isSoftExactMatch && styles.softExactResultText,
                      (isExactMatch || isClosestMatch) && styles.exactResultText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function moveIndexToFront<TValue>(values: readonly TValue[], index: number) {
  const nextValues = [...values];
  [nextValues[0], nextValues[index]] = [nextValues[index], nextValues[0]];

  return nextValues;
}

function compareNullableDate(
  left: string | null | undefined,
  right: string | null | undefined,
): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;

  return left.localeCompare(right);
}

function compareLabel(left: string, right: string): number {
  const normalizedLeft = left.toLocaleLowerCase();
  const normalizedRight = right.toLocaleLowerCase();

  if (normalizedLeft !== normalizedRight) {
    if (normalizedRight.startsWith(normalizedLeft)) return -1;
    if (normalizedLeft.startsWith(normalizedRight)) return 1;
  }

  return left.localeCompare(right);
}

const styles = StyleSheet.create({
  belt: {
    flexDirection: "row",
  },
  container: {
    gap: 8,
  },
  edgeToEdgeBelt: {
    paddingLeft: modalTheme.sheet.contentPaddingHorizontal,
  },
  edgeToEdgeList: {
    marginHorizontal: -modalTheme.sheet.contentPaddingHorizontal,
  },
  closestResultText: {
    color: modalTheme.control.text,
  },
  divider: {
    color: modalTheme.modalWheel.bar,
    fontSize: 18,
    fontWeight: "300",
  },
  exactResultText: {
    color: modalTheme.modalChip.tone.active.background,
  },
  list: {
    maxHeight: 42,
  },
  pressed: {
    opacity: 0.72,
  },
  result: {
    maxWidth: 220,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  resultGroup: {
    alignItems: "center",
    flexDirection: "row",
  },
  resultText: {
    color: modalTheme.modalText.status,
    fontSize: 15,
    fontWeight: "800",
  },
  softExactResultText: {
    color: modalTheme.control.text,
  },
  status: {
    color: modalTheme.modalText.status,
    fontSize: 13,
    fontWeight: "800",
  },
});
