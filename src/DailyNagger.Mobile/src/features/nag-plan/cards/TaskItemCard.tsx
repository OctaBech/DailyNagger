import { Activity, memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card } from "@/components";
import { type TaskItem } from "@/models";
import { usePlanScreenCommands } from "@/services";
import { TaskEntryCard } from "./TaskEntryCard";
import { nagPlanTheme } from "../theme";
import { useDebugRenderFrameCounter } from "@/debug/render-frame";

type TaskItemCardProps = {
  taskItem: TaskItem;
  readonly railTone: "active" | "completed";
};

const TaskItemCardComponent = ({ taskItem, railTone }: TaskItemCardProps) => {
  const { setDoneAndSetFocus, setExpanded, setFocused } = usePlanScreenCommands().taskItem;
  useDebugRenderFrameCounter("PlanTaskItemCard", taskItem.id);

  const hasChildren = taskItem.taskItems.length + taskItem.taskEntries.length > 0;
  const isExpanded = taskItem.clientProps.isExpanded && hasChildren;
  const isSelected = taskItem.clientProps.isSelected;
  const hasFocus = taskItem.clientProps.hasFocus;
  const hasActiveRail = hasFocus || taskItem.clientProps.isFocusParent;
  const toggleExpanded = () => {
    setExpanded(taskItem, !isExpanded && hasChildren);
  };

  return (
    <View
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        taskItem.rolloverBehavior === "RemoveWhenDone" && styles.removedOnRolloverCard,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select task item"
        onPress={() => setFocused(taskItem)}
        style={[
          styles.railLane,
          { backgroundColor: hasActiveRail ? getRailColor(railTone) : nagPlanTheme.rail.neutral },
        ]}
      />
      <Card.TaskItemFrame>
        <Card.TaskItemField
          taskItem={taskItem}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          allowEditName={false}
          showComponentOutlines={false}
          muteCheckmark={false}
          checkmarkShape={taskItem.rolloverBehavior === "RemoveWhenDone" ? "circle" : "square"}
          onFocus={() => setFocused(taskItem)}
          onDonePress={() => setDoneAndSetFocus(taskItem, !taskItem.isDone)}
          onNameCommit={() => undefined}
          onExpandPress={toggleExpanded}
        />

        <Activity mode={isExpanded ? "visible" : "hidden"}>
          <View style={styles.children}>
            {taskItem.taskEntries.map((taskEntry) => (
              <TaskEntryCard key={taskEntry.id} taskEntry={taskEntry} railTone={railTone} />
            ))}
            {taskItem.taskItems.map((childTaskItem) => (
              <TaskItemCard key={childTaskItem.id} taskItem={childTaskItem} railTone={railTone} />
            ))}
          </View>
        </Activity>
      </Card.TaskItemFrame>
    </View>
  );
};

export const TaskItemCard = memo(TaskItemCardComponent);

function getRailColor(railTone: TaskItemCardProps["railTone"]): string {
  return railTone === "completed" ? nagPlanTheme.rail.completed : nagPlanTheme.rail.active;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: nagPlanTheme.rail.contentGap,
    overflow: "hidden",
    position: "relative",
  },
  children: {
    gap: nagPlanTheme.cardDensity.fieldGap,
    paddingTop: nagPlanTheme.cardDensity.childTopPadding,
  },
  removedOnRolloverCard: {
    backgroundColor: nagPlanTheme.taskItem.removedOnRolloverBackground,
  },
  selectedCard: {
    backgroundColor: nagPlanTheme.taskItem.selectedBackground,
  },
  railLane: {
    width: nagPlanTheme.rail.focusLaneWidth,
  },
});
