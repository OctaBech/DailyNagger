import { useMemo } from "react";
import type { SelectedNodes, TreePath } from "@/models";
import type { Guid } from "@/shared";
import type { PlanScreenCommands } from "../screen-commands";
import type { SpeedDialMenu, SpeedDialMenuItem } from "./SpeedDialMenu";
import { readPlanSpeedDialMenuState } from "./readPlanSpeedDialMenuState";

type UseCreatePlanScreenDialMenuProps = {
  readonly planCommands: PlanScreenCommands;
  readonly actionsAreAvailable: boolean;
  readonly selectedNodes: SelectedNodes;
  readonly selectedPath: TreePath;
  readonly onCreateNagger: () => void;
  readonly onEditNagger: (naggerId: Guid) => void;
};

export function useCreatePlanScreenDialMenu({
  planCommands,
  actionsAreAvailable,
  selectedNodes,
  selectedPath,
  onCreateNagger,
  onEditNagger,
}: UseCreatePlanScreenDialMenuProps): SpeedDialMenu {
  const { pinSelectedNagger, unpinSelectedNagger } = planCommands.dial;

  return useMemo(() => {
    const menuState = readPlanSpeedDialMenuState({
      actionsAreAvailable,
      selectedNodes,
      selectedPath,
    });

    if (!menuState.canCreateNagger) return { items: [] };

    const newNagger: SpeedDialMenuItem = {
      key: "plan.new-nagger",
      iconType: "vector",
      iconValue: "bell-plus",
      label: "New nagger",
      showLabel: true,
      onSelect: onCreateNagger,
    };

    const { selectedNagger } = menuState;

    if (!menuState.canEditNagger || selectedNagger === null) return { items: [newNagger] };

    const pinItems: SpeedDialMenuItem[] = [];

    if (menuState.canPinNagger) {
      pinItems.push({
        key: "plan.pin-selected-nagger",
        iconType: "vector",
        iconValue: "pin",
        label: "Pin",
        showLabel: true,
        onSelect: () => pinSelectedNagger(selectedNagger),
      });
    }

    if (menuState.canUnpinNagger) {
      pinItems.push({
        key: "plan.unpin-selected-nagger",
        iconType: "vector",
        iconValue: "pin-off",
        label: "Unpin",
        showLabel: true,
        onSelect: () => unpinSelectedNagger(selectedNagger),
      });
    }

    return {
      items: [
        newNagger,
        ...pinItems,
        {
          key: "plan.edit-selected-nagger",
          iconType: "vector",
          iconValue: "pencil-box-outline",
          label: "Edit nagger",
          showLabel: true,
          onSelect: () => onEditNagger(selectedNagger.id),
        },
      ],
    };
  }, [
    actionsAreAvailable,
    onCreateNagger,
    onEditNagger,
    pinSelectedNagger,
    selectedNodes,
    selectedPath,
    unpinSelectedNagger,
  ]);
}
