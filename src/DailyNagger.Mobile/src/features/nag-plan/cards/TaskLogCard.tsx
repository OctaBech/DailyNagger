import { memo, useMemo, useState } from "react";
import { Card, Modal } from "@/components";
import { type TaskItem, type TaskLog } from "@/models";
import { TaskItemCard } from "./TaskItemCard";
import { usePlanScreenCommands } from "@/services";
import { useDebugRenderFrameCounter } from "@/debug/render-frame";
import { useTaskStepNameSuggestions } from "@/task-step-suggestions";

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
  const { addTaskStep, setFocused } = usePlanScreenCommands().taskLog;
  useDebugRenderFrameCounter("PlanTaskLogCard", taskLog.id);

  const [isTaskStepNameModalVisible, setIsTaskStepNameModalVisible] = useState(false);
  const { suggestions, isLoadingSuggestions, hasSuggestionLoadError } =
    useTaskStepNameSuggestions(taskLog.nagId);
  const taskStepNameSuggestions = useMemo(
    () => mergeTaskStepNameSuggestions(suggestions, taskLog),
    [suggestions, taskLog],
  );
  const isSelected = taskLog.clientProps.isSelected;
  const isInsideFocusedTree =
    parentNaggerHasFocus || taskLog.clientProps.hasFocus || isSelected;

  return (
    <>
      <Card.TaskLogFrame isSelected={isSelected}>
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
          onAddTaskItem={() => {
            setFocused(taskLog);
            setIsTaskStepNameModalVisible(true);
          }}
          onFocus={() => setFocused(taskLog)}
        />
      </Card.TaskLogFrame>

      <Modal.TaskStepNameModal
        visible={isTaskStepNameModalVisible}
        hasSuggestionLoadError={hasSuggestionLoadError}
        isLoadingSuggestions={isLoadingSuggestions}
        suggestions={taskStepNameSuggestions}
        onDismiss={() => setIsTaskStepNameModalVisible(false)}
        onAddTaskStep={(name, rolloverBehavior) => {
          addTaskStep(taskLog, name, rolloverBehavior);
          setIsTaskStepNameModalVisible(false);
        }}
      />
    </>
  );
};

export const TaskLogCard = memo(TaskLogCardComponent);

type TaskStepNameSuggestion = {
  readonly name: string;
};

function mergeTaskStepNameSuggestions(
  remoteSuggestions: readonly TaskStepNameSuggestion[],
  taskLog: TaskLog,
): readonly TaskStepNameSuggestion[] {
  const names = new Set(remoteSuggestions.map((suggestion) => suggestion.name));

  addTaskItemNames(names, taskLog.taskItems);

  return [...names].sort((left, right) => left.localeCompare(right)).map((name) => ({ name }));
}

function addTaskItemNames(names: Set<string>, taskItems: readonly TaskItem[]): void {
  for (const taskItem of taskItems) {
    if (taskItem.name.trim() !== "") names.add(taskItem.name);
    addTaskItemNames(names, taskItem.taskItems);
  }
}
