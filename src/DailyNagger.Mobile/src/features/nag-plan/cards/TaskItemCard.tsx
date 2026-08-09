import { Activity, memo } from "react";
import { StyleSheet, View } from "react-native";
import { Card } from "@/components";
import { type TaskItem } from "@/models";
import { usePlanScreenCommands } from "@/services";
import { TaskEntryCard } from "./TaskEntryCard";
import { nagPlanTheme } from "../theme";
import { useDebugRenderFrameCounter } from "@/debug/render-frame";

type TaskItemCardProps = {
  taskItem: TaskItem;
};

const TaskItemCardComponent = ({ taskItem }: TaskItemCardProps) => {
  const { setDoneAndSetFocus, setExpanded, setFocused } = usePlanScreenCommands().taskItem;
  useDebugRenderFrameCounter("PlanTaskItemCard", taskItem.id);

  const hasChildren = taskItem.taskItems.length + taskItem.taskEntries.length > 0;
  const isExpanded = taskItem.clientProps.isExpanded && hasChildren;
  const isSelected = taskItem.clientProps.isSelected;
  const hasFocus = taskItem.clientProps.hasFocus;
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
      {hasFocus ? <Card.FocusFrame radius={nagPlanTheme.radius.card} /> : null}
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
              <TaskEntryCard key={taskEntry.id} taskEntry={taskEntry} />
            ))}
            {taskItem.taskItems.map((childTaskItem) => (
              <TaskItemCard key={childTaskItem.id} taskItem={childTaskItem} />
            ))}
          </View>
        </Activity>
      </Card.TaskItemFrame>
    </View>
  );
};

export const TaskItemCard = memo(TaskItemCardComponent);

const taskItemChrome = Card.createStableCardChromeStyleObjects({
  background: nagPlanTheme.taskItem.background,
  border: nagPlanTheme.taskItem.border,
  chrome: nagPlanTheme.cardChrome,
  radius: nagPlanTheme.radius.card,
  selectedBackground: nagPlanTheme.taskItem.selectedBackground,
  selectedBorder: nagPlanTheme.selection.border,
});

const styles = StyleSheet.create({
  ...taskItemChrome,
  card: {
    ...taskItemChrome.card,
    position: "relative",
  },
  children: {
    gap: nagPlanTheme.cardDensity.fieldGap,
    paddingTop: nagPlanTheme.cardDensity.padding,
  },
  removedOnRolloverCard: {
    backgroundColor: nagPlanTheme.taskItem.removedOnRolloverBackground,
    borderBottomColor: nagPlanTheme.taskItem.removedOnRolloverBorder,
    borderLeftColor: nagPlanTheme.taskItem.removedOnRolloverBorder,
    borderRightColor: nagPlanTheme.taskItem.removedOnRolloverBorder,
    borderTopColor: nagPlanTheme.taskItem.removedOnRolloverBorder,
  },
  selectedCard: {
    backgroundColor: nagPlanTheme.taskItem.selectedBackground,
    borderBottomColor: nagPlanTheme.selection.border,
    borderLeftColor: nagPlanTheme.taskItem.selectedBackground,
    borderRightColor: nagPlanTheme.selection.border,
    borderTopColor: nagPlanTheme.taskItem.selectedBackground,
  },
});
