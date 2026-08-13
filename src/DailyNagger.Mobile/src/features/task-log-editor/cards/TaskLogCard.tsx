import { memo, useState } from "react";
import { Card, Modal } from "@/components";
import { type TaskLog } from "@/models";
import { TaskItemCard } from "./TaskItemCard";
import { useEditorScreenCommands } from "@/services";
import { tagTypes } from "@/tagging";
import { useDebugRenderFrameCounter } from "@/debug/render-frame";

type TaskLogCardProps = {
  taskLog: TaskLog;
  readonly parentNaggerHasFocus?: boolean;
};

const TaskLogCardComponent = ({ taskLog, parentNaggerHasFocus = false }: TaskLogCardProps) => {
  const { taskLog: taskLogActions } = useEditorScreenCommands();
  useDebugRenderFrameCounter("EditorTaskLogCard", taskLog.id);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  const isSelected = taskLog.clientProps.isSelected;

  return (
    <>
      <Card.TaskLogFrame
        hasFocus={taskLog.clientProps.hasFocus}
        parentNaggerHasFocus={parentNaggerHasFocus}
        isSelected={isSelected}
        onRailPress={() => taskLogActions.setFocused(taskLog)}
      >
        <Card.TaskLogField
          onFocus={() => taskLogActions.setFocused(taskLog)}
        />
        {taskLog.taskItems.map((taskItem) => (
          <TaskItemCard key={taskItem.id} taskItem={taskItem} />
        ))}
        <Card.TaskLogTail
          taskLog={taskLog}
          allowEditTag
          isTagPickerOpen={isTagModalVisible}
          showComponentOutlines
          onFocus={() => taskLogActions.setFocused(taskLog)}
          onPressTag={() => setIsTagModalVisible(true)}
          isTaskStepAddDisabled
        />
      </Card.TaskLogFrame>

      <Modal.TaggingModal
        visible={isTagModalVisible}
        tagType={tagTypes.taskLog}
        tagName={taskLog.tag}
        onDismiss={() => setIsTagModalVisible(false)}
        onSave={(savedTagName) => {
          taskLogActions.setTag(taskLog, savedTagName);
          setIsTagModalVisible(false);
        }}
      />
    </>
  );
};

export const TaskLogCard = memo(TaskLogCardComponent);
