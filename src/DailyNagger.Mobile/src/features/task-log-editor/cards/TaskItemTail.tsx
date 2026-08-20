import { StyleSheet, Text, View } from "react-native";
import { Icon } from "react-native-paper";
import { Card, Primitives } from "@/components";
import { nagPlanTheme } from "../theme";

type TaskItemTailProps = {
  readonly isTagPickerOpen?: boolean;
  readonly onFocus: () => void;
  readonly onAddTaskEntry: () => void;
  readonly onAddTaskItem: () => void;
  readonly onPressTag: () => void;
  readonly showComponentOutlines?: boolean;
  readonly tagName: string | null;
};

export const TaskItemTail = ({
  isTagPickerOpen = false,
  onFocus,
  onAddTaskEntry,
  onAddTaskItem,
  onPressTag,
  showComponentOutlines = false,
  tagName,
}: TaskItemTailProps) => {
  const tagText = tagName ?? "tag";

  return (
    <View style={styles.tail}>
      <View style={styles.actions}>
        <Card.CardActionButton accessibilityLabel="Add child task step" onPress={onAddTaskItem}>
          <Text selectable={false} style={styles.plus}>
            +
          </Text>
          <Text selectable={false} style={styles.checkGlyph}>
            ✔
          </Text>
        </Card.CardActionButton>
        <Card.CardActionButton accessibilityLabel="Add task note" onPress={onAddTaskEntry}>
          <Text selectable={false} style={styles.plus}>
            +
          </Text>
          <View style={styles.noteIcon}>
            <Icon source="note-outline" size={17} color={nagPlanTheme.taskItem.chevronText} />
          </View>
        </Card.CardActionButton>
        <Primitives.PillButton
          label={tagText}
          isEmpty={tagName === null}
          showOutline={showComponentOutlines}
          isActive={isTagPickerOpen}
          onPress={() => {
            onFocus();
            onPressTag();
          }}
        />
      </View>
      <Primitives.RowRemainderPressable
        accessibilityLabel="Select task item"
        onPress={onFocus}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  checkGlyph: {
    color: nagPlanTheme.taskItem.chevronText,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 16,
  },
  plus: {
    color: nagPlanTheme.taskItem.chevronText,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  noteIcon: {
    height: 18,
    justifyContent: "center",
  },
  tail: {
    alignItems: "flex-end",
    flexDirection: "row",
    minHeight: 38,
    paddingBottom: 5,
    paddingTop: 5,
  },
});
