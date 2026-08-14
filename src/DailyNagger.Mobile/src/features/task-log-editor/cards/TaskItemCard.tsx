import { Activity, memo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Card, Modal, SelectionLane } from "@/components";
import { type TaskItem } from "@/models";
import { useEditorScreenCommands } from "@/services";
import { TaskEntryCard } from "./TaskEntryCard";
import { nagPlanTheme } from "../theme";
import { tagTypes } from "@/tagging";
import { useDebugRenderFrameCounter } from "@/debug/render-frame";

type TaskItemCardProps = {
  taskItem: TaskItem;
};

const TaskItemCardComponent = ({ taskItem }: TaskItemCardProps) => {
  const { taskItem: taskItemActions } = useEditorScreenCommands();
  useDebugRenderFrameCounter("EditorTaskItemCard", taskItem.id);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);

  const hasChildren = taskItem.taskItems.length + taskItem.taskEntries.length > 0;
  const isExpanded = taskItem.clientProps.isExpanded && hasChildren;
  const isSelected = taskItem.clientProps.isSelected;
  const hasFocus = taskItem.clientProps.hasFocus;
  const hasActiveRail = hasFocus || taskItem.clientProps.isFocusParent;
  const toggleExpanded = () => {
    taskItemActions.setExpanded(taskItem, !isExpanded && hasChildren);
  };

  return (
    <View
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        taskItem.rolloverBehavior === "RemoveWhenDone" && styles.removedOnRolloverCard,
      ]}
    >
      <SelectionLane.SelectionLane
        accessibilityLabel="Select task item"
        onPress={() => taskItemActions.setFocused(taskItem)}
        tone={hasActiveRail ? "active" : "neutral"}
      />
      <Card.TaskItemFrame>
        <Card.TaskItemField
          taskItem={taskItem}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          allowEditName
          allowEditTag
          isTagPickerOpen={isTagModalVisible}
          showComponentOutlines
          muteCheckmark
          checkmarkShape={taskItem.rolloverBehavior === "RemoveWhenDone" ? "circle" : "square"}
          onFocus={() => taskItemActions.setFocused(taskItem)}
          onNameFocus={() => taskItemActions.setFocused(taskItem)}
          onDonePress={toggleExpanded}
          onNameCommit={(newName) => taskItemActions.setName(taskItem, newName)}
          onExpandPress={toggleExpanded}
          onPressTag={() => setIsTagModalVisible(true)}
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

      <Modal.TaggingModal
        visible={isTagModalVisible}
        tagType={tagTypes.taskItem}
        tagName={taskItem.tag}
        onDismiss={() => setIsTagModalVisible(false)}
        onSave={(savedTagName) => {
          taskItemActions.setTag(taskItem, savedTagName);
          setIsTagModalVisible(false);
        }}
      />
    </View>
  );
};

export const TaskItemCard = memo(TaskItemCardComponent);

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
  removedOnRolloverCard: {
    backgroundColor: nagPlanTheme.taskItem.removedOnRolloverBackground,
  },
  selectedCard: {
    backgroundColor: nagPlanTheme.taskItem.selectedBackground,
  },
});
