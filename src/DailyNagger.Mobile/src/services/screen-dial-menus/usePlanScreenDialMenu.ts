import { useMemo } from "react";
import { treeSelection } from "@/models";
import type { Guid } from "@/shared";
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
  const { nagger } = selectedNodes;
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

    if (treeSelection.canBePinned(selectedPath)) {
      pinItems.push({
        key: "plan.pin-selected-nagger",
        icon: "pin",
        label: "Pin",
        showLabel: true,
        onSelect: () => pinSelectedNagger(nagger),
      });
    }

    if (treeSelection.canBeUnpinned(selectedPath)) {
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
    pinSelectedNagger,
    selectedPath,
    startup.isReady,
    unpinSelectedNagger,
  ]);
}
