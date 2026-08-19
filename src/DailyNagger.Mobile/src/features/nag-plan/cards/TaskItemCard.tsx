import { Activity, memo } from "react";
import { StyleSheet, View } from "react-native";
import { Card, SelectionLane } from "@/components";
import { type TaskItem } from "@/models";
import { usePlanScreenCommands } from "@/services";
import { TaskEntryCard } from "./TaskEntryCard";
import { nagPlanTheme } from "../theme";
import { useDebugRenderFrameCounter } from "@/debug/render-frame";

type TaskItemCardProps = {
  taskItem: TaskItem;
  readonly isInsideFocusedTree?: boolean;
  readonly railTone: "active" | "completed";
};

type SelectionLaneTone = "active" | "activeSoft" | "completed" | "completedSoft" | "neutral";

const TaskItemCardComponent = ({
  isInsideFocusedTree = false,
  taskItem,
  railTone,
}: TaskItemCardProps) => {
  const { deleteOnce, setDoneAndSetFocus, setExpanded, setFocused } =
    usePlanScreenCommands().taskItem;
  useDebugRenderFrameCounter("PlanTaskItemCard", taskItem.id);

  const isOnceTaskItem = taskItem.rolloverBehavior === "RemoveWhenDone";
  const hasChildren = taskItem.taskItems.length + taskItem.taskEntries.length > 0;
  const canDeleteOnce = isOnceTaskItem && !hasChildren;
  const isExpanded = taskItem.clientProps.isExpanded && hasChildren;
  const isSelected = taskItem.clientProps.isSelected;
  const hasFocus = taskItem.clientProps.hasFocus;
  const hasActiveRail = hasFocus || taskItem.clientProps.isFocusParent;
  const railSelectionTone = getRailSelectionTone(
    railTone,
    hasActiveRail,
    isInsideFocusedTree,
  );
  const toggleExpanded = () => {
    setExpanded(taskItem, !isExpanded && hasChildren);
  };

  return (
    <View
      style={[
        styles.card,
        isSelected && styles.selectedCard,
      ]}
    >
      <SelectionLane.SelectionLane
        accessibilityLabel="Select task item"
        onPress={() => setFocused(taskItem)}
        tone={railSelectionTone}
      />
      <Card.TaskItemFrame>
        <Card.TaskItemField
          taskItem={taskItem}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          allowEditName={false}
          showComponentOutlines={false}
          muteCheckmark={false}
          checkmarkShape={isOnceTaskItem ? "circle" : "square"}
          onFocus={() => setFocused(taskItem)}
          onDonePress={() => setDoneAndSetFocus(taskItem, !taskItem.isDone)}
          onDeletePress={canDeleteOnce ? () => deleteOnce(taskItem) : undefined}
          onNameCommit={() => undefined}
          onExpandPress={toggleExpanded}
        />

        <Activity mode={isExpanded ? "visible" : "hidden"}>
          <View style={styles.children}>
            {taskItem.taskEntries.map((taskEntry) => (
              <TaskEntryCard key={taskEntry.id} taskEntry={taskEntry} railTone={railTone} />
            ))}
            {taskItem.taskItems.map((childTaskItem) => (
              <TaskItemCard
                key={childTaskItem.id}
                isInsideFocusedTree={isInsideFocusedTree}
                taskItem={childTaskItem}
                railTone={railTone}
              />
            ))}
          </View>
        </Activity>
      </Card.TaskItemFrame>
    </View>
  );
};

export const TaskItemCard = memo(TaskItemCardComponent);

function getRailSelectionTone(
  railTone: TaskItemCardProps["railTone"],
  hasActiveRail: boolean,
  isInsideFocusedTree: boolean,
): SelectionLaneTone {
  if (hasActiveRail) return railTone;
  if (!isInsideFocusedTree) return "neutral";

  return railTone === "completed" ? "completedSoft" : "activeSoft";
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    overflow: "hidden",
    position: "relative",
  },
  children: {
    gap: nagPlanTheme.cardDensity.fieldGap,
    paddingTop: nagPlanTheme.cardDensity.childTopPadding,
  },
  selectedCard: {
    backgroundColor: nagPlanTheme.taskItem.selectedBackground,
  },
});
