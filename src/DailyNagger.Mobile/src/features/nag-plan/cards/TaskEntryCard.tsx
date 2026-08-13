import { Card } from "@/components";
import { type TaskEntry } from "@/models";
import { usePlanScreenCommands } from "@/services";
import { memo } from "react";
import { useDebugRenderFrameCounter } from "@/debug/render-frame";

type TaskEntryCardProps = {
  readonly taskEntry: TaskEntry;
  readonly railTone: "active" | "completed";
};

const TaskEntryCardComponent = ({ taskEntry, railTone }: TaskEntryCardProps) => {
  const { decimalSeparator, setFocused, setValue } = usePlanScreenCommands().taskEntry;
  useDebugRenderFrameCounter("PlanTaskEntryCard", taskEntry.id);

  const isSelected = taskEntry.clientProps.isSelected;

  return (
    <Card.TaskEntryFrame
      hasFocus={taskEntry.clientProps.hasFocus}
      isSelected={isSelected}
      isRemovedOnRollover={taskEntry.rolloverBehavior === "Remove"}
      onMarkerPress={() => setFocused(taskEntry)}
      railTone={railTone}
    >
      <Card.TaskEntryField
        taskEntry={taskEntry}
        allowEditLabel={false}
        allowEditTag={false}
        allowEditValue
        decimalSeparator={decimalSeparator}
        showComponentOutlines={false}
        onFocus={() => setFocused(taskEntry)}
        onLabelCommit={() => undefined}
        onValueCommit={(newValue) => setValue(taskEntry, newValue)}
      />
    </Card.TaskEntryFrame>
  );
};

export const TaskEntryCard = memo(TaskEntryCardComponent);
