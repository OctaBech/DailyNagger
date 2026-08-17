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
  readonly railTone: "active" | "completed";
};

const TaskLogCardComponent = ({
  taskLog,
  parentNaggerHasFocus = false,
  railTone,
}: TaskLogCardProps) => {
  const { taskLog: taskLogActions } = useEditorScreenCommands();
  useDebugRenderFrameCounter("EditorTaskLogCard", taskLog.id);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  const isSelected = taskLog.clientProps.isSelected;
  const isInsideFocusedTree =
    parentNaggerHasFocus || taskLog.clientProps.hasFocus || isSelected;

  return (
    <>
      <Card.TaskLogFrame
        isSelected={isSelected}
      >
        {taskLog.taskItems.map((taskItem) => (
          <TaskItemCard
            key={taskItem.id}
            isInsideFocusedTree={isInsideFocusedTree}
            taskItem={taskItem}
            railTone={railTone}
          />
        ))}
        <Card.TaskLogTail
          taskLog={taskLog}
          allowEditTag
          isTagPickerOpen={isTagModalVisible}
          showComponentOutlines
          onAddTaskItem={() => taskLogActions.addTaskItem(taskLog)}
          onFocus={() => taskLogActions.setFocused(taskLog)}
          onPressTag={() => setIsTagModalVisible(true)}
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
