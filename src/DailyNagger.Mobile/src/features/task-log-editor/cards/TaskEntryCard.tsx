import { Card, Modal } from "@/components";
import type { TaskEntry } from "@/models";
import { useEditorScreenCommands } from "@/services";
import { memo, useState } from "react";
import { useDebugRenderFrameCounter } from "@/debug/render-frame";

type TaskEntryCardProps = {
  taskEntry: TaskEntry;
};

const TaskEntryCardComponent = ({ taskEntry }: TaskEntryCardProps) => {
  const { taskEntry: taskEntryActions } = useEditorScreenCommands();
  useDebugRenderFrameCounter("EditorTaskEntryCard", taskEntry.id);
  const isSelected = taskEntry.clientProps.isSelected;
  const [isValueTypeModalVisible, setIsValueTypeModalVisible] = useState(false);

  return (
    <>
      <Card.TaskEntryFrame
        hasFocus={taskEntry.clientProps.hasFocus}
        isSelected={isSelected}
        isRemovedOnRollover={taskEntry.rolloverBehavior === "Remove"}
        onMarkerPress={() => taskEntryActions.setFocused(taskEntry)}
      >
        <Card.TaskEntryField
          taskEntry={taskEntry}
          allowEditLabel
          allowEditTag={false}
          allowEditValue={false}
          isValueTypePickerOpen={isValueTypeModalVisible}
          showTag={false}
          showComponentOutlines
          onFocus={() => taskEntryActions.setFocused(taskEntry)}
          onLabelCommit={(newLabel) => taskEntryActions.setLabel(taskEntry, newLabel)}
          onValueCommit={(newValue) => taskEntryActions.setValue(taskEntry, newValue)}
          onPressValueType={() => setIsValueTypeModalVisible(true)}
        />
      </Card.TaskEntryFrame>

      {isValueTypeModalVisible && (
        <Modal.TaskEntryValueTypeModal
          visible={isValueTypeModalVisible}
          selectedValueType={taskEntry.valueType}
          selectedRolloverBehavior={taskEntry.rolloverBehavior}
          onDismiss={() => setIsValueTypeModalVisible(false)}
          onSelect={(valueType, rolloverBehavior) => {
            taskEntryActions.setValueType(taskEntry, valueType, rolloverBehavior);
            setIsValueTypeModalVisible(false);
          }}
        />
      )}
    </>
  );
};

export const TaskEntryCard = memo(TaskEntryCardComponent);
