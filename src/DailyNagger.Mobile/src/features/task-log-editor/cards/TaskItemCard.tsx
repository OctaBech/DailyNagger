import { Activity, memo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Card, Modal, SelectionLane } from "@/components";
import { type TaskItem } from "@/models";
import { useEditorScreenCommands } from "@/services";
import { TaskEntryCard } from "./TaskEntryCard";
import { TaskItemTail } from "./TaskItemTail";
import { nagPlanTheme } from "../theme";
import { tagTypes } from "@/tagging";
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
  const { taskItem: taskItemActions } = useEditorScreenCommands();
  useDebugRenderFrameCounter("EditorTaskItemCard", taskItem.id);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);

  const hasChildren = taskItem.taskItems.length + taskItem.taskEntries.length > 0;
  const isExpanded = taskItem.clientProps.isExpanded;
  const isSelected = taskItem.clientProps.isSelected;
  const hasFocus = taskItem.clientProps.hasFocus;
  const hasActiveRail = hasFocus || taskItem.clientProps.isFocusParent;
  const railSelectionTone = getRailSelectionTone(
    railTone,
    hasActiveRail,
    isInsideFocusedTree,
  );
  const toggleExpanded = () => {
    taskItemActions.setExpanded(taskItem, !isExpanded);
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
        onPress={() => taskItemActions.setFocused(taskItem)}
        tone={railSelectionTone}
      />
      <Card.TaskItemFrame>
        <Card.TaskItemField
          taskItem={taskItem}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          allowEditName
          isTagPickerOpen={isTagModalVisible}
          showTag={false}
          showComponentOutlines
          forceExpandableIndicator
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
              <TaskEntryCard
                key={taskEntry.id}
                taskEntry={taskEntry}
                railTone={railTone}
              />
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

        {isExpanded && (
          <TaskItemTail
            isTagPickerOpen={isTagModalVisible}
            onFocus={() => taskItemActions.setFocused(taskItem)}
            onAddTaskEntry={() => taskItemActions.addTaskEntry(taskItem)}
            onAddTaskItem={() => taskItemActions.addTaskItem(taskItem)}
            onPressTag={() => setIsTagModalVisible(true)}
            showComponentOutlines
            tagName={taskItem.tag}
          />
        )}
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
