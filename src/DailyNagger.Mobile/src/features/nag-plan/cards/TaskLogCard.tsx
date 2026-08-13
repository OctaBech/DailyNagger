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
  const { suggestions } = useTaskStepNameSuggestions(taskLog.nagId);
  const taskStepNameSuggestions = useMemo(
    () => mergeTaskStepNameSuggestions(suggestions, taskLog),
    [suggestions, taskLog],
  );

  const isCompleted = isCompletedTaskLog(taskLog);
  const isSelected = taskLog.clientProps.isSelected;

  return (
    <>
      <Card.TaskLogFrame
        hasFocus={taskLog.clientProps.hasFocus}
        parentNaggerHasFocus={parentNaggerHasFocus}
        isCompleted={isCompleted}
        isSelected={isSelected}
        onRailPress={() => setFocused(taskLog)}
        railTone={railTone}
      >
        <Card.TaskLogField
          onFocus={() => setFocused(taskLog)}
        />
        {taskLog.taskItems.map((taskItem) => (
          <TaskItemCard key={taskItem.id} taskItem={taskItem} railTone={railTone} />
        ))}
        <Card.TaskLogTail
          taskLog={taskLog}
          onFocus={() => setFocused(taskLog)}
          onPressAddTaskStep={() => setIsTaskStepNameModalVisible(true)}
        />
      </Card.TaskLogFrame>

      <Modal.TaskStepNameModal
        visible={isTaskStepNameModalVisible}
        suggestions={taskStepNameSuggestions}
        onAddTaskStep={(name, rolloverBehavior) => addTaskStep(taskLog, name, rolloverBehavior)}
        onDismiss={() => setIsTaskStepNameModalVisible(false)}
      />
    </>
  );
};

export const TaskLogCard = memo(TaskLogCardComponent);

function isCompletedTaskLog(taskLog: TaskLog): boolean {
  return (
    taskLog.descendantTaskItemCount > 0 &&
    taskLog.doneDescendantTaskItemCount === taskLog.descendantTaskItemCount
  );
}

type TaskStepNameSuggestion = {
  readonly name: string;
};

function mergeTaskStepNameSuggestions(
  remoteSuggestions: readonly TaskStepNameSuggestion[],
  taskLog: TaskLog,
): readonly TaskStepNameSuggestion[] {
  // Include local task steps so newly queued names are suggested without refetching the DB-backed list.
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
