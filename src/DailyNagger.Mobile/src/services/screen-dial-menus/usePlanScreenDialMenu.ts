import { useMemo } from "react";
import { treeSelection, type SelectedNodes, type TreePath } from "@/models";
import type { Guid } from "@/shared";
import type { PlanScreenCommands } from "../screen-commands";
import type { SpeedDialMenu, SpeedDialMenuItem } from "./SpeedDialMenu";

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
  const { nagger } = selectedNodes;
  const { pinSelectedNagger, unpinSelectedNagger } = planCommands.dial;

  return useMemo(() => {
    if (!actionsAreAvailable) return { items: [] };

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
    actionsAreAvailable,
    nagger,
    onCreateNagger,
    onEditNagger,
    pinSelectedNagger,
    selectedPath,
    unpinSelectedNagger,
  ]);
}
