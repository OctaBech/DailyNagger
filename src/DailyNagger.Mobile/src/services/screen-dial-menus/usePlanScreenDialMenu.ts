import { useMemo } from "react";
import type { Guid } from "@/shared";
import { nodeReaderOperations } from "../core-node-operations";
import type { PlanScreenCommands } from "../screen-commands";
import type { PlanScreenData } from "../screen-data";
import type { SpeedDialMenu, SpeedDialMenuItem } from "./SpeedDialMenu";

type UseCreatePlanScreenDialMenuProps = {
  readonly planCommands: PlanScreenCommands;
  readonly planScreenData: PlanScreenData;
  readonly onCreateNagger: () => void;
  readonly onEditNagger: (naggerId: Guid) => void;
};

export function useCreatePlanScreenDialMenu({
  planCommands,
  planScreenData,
  onCreateNagger,
  onEditNagger,
}: UseCreatePlanScreenDialMenuProps): SpeedDialMenu {
  const { selectedNodes, selectedPath, startup, mood } = planScreenData;
  const { nagger, taskItem } = selectedNodes;
  const { pinSelectedNagger, unpinSelectedNagger } = planCommands.dial;

  return useMemo(() => {
    if (!startup.isReady) return { items: [] };
    if (mood.selectedMood === null) return { items: [] };

    const newNagger: SpeedDialMenuItem = {
      key: "plan.new-nagger",
      icon: "bell-plus",
      label: "New nagger",
      showLabel: true,
      onSelect: onCreateNagger,
    };

    if (nagger === null) return { items: [newNagger] };

    const pinItems: SpeedDialMenuItem[] = [];

    if (nodeReaderOperations.canBePinned(selectedPath)) {
      pinItems.push({
        key: "plan.pin-selected-nagger",
        icon: "pin",
        label: "Pin",
        showLabel: true,
        onSelect: () => pinSelectedNagger(nagger),
      });
    }

    if (nodeReaderOperations.canBeUnpinned(selectedPath)) {
      pinItems.push({
        key: "plan.unpin-selected-nagger",
        icon: "pin-off",
        label: "Unpin",
        showLabel: true,
        onSelect: () => unpinSelectedNagger(nagger),
      });
    }

    return {
      items: [
        newNagger,
        ...(taskItem !== null
          ? [
              {
                key: "plan.add-quick-note",
                icon: "comment-plus-outline",
                label: "Quick note",
                showLabel: true,
                onSelect: () => planCommands.taskItem.addQuickNote(taskItem),
              },
            ]
          : []),
        ...pinItems,
        {
          key: "plan.edit-selected-nagger",
          icon: "pencil-box-outline",
          label: "Edit nagger",
          showLabel: true,
          onSelect: () => onEditNagger(nagger.id),
        },
      ],
    };
  }, [
    mood.selectedMood,
    nagger,
    onCreateNagger,
    onEditNagger,
    planCommands.taskItem,
    pinSelectedNagger,
    selectedPath,
    startup.isReady,
    taskItem,
    unpinSelectedNagger,
  ]);
}
