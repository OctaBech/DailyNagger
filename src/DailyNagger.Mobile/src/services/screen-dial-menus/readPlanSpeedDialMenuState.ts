import { treeSelection, type Nagger, type SelectedNodes, type TreePath } from "@/models";

export type PlanSpeedDialMenuState = {
  readonly canCreateNagger: boolean;
  readonly canEditNagger: boolean;
  readonly canPinNagger: boolean;
  readonly canUnpinNagger: boolean;
  readonly selectedNagger: Nagger | null;
};

type ReadPlanSpeedDialMenuStateProps = {
  readonly actionsAreAvailable: boolean;
  readonly selectedNodes: SelectedNodes;
  readonly selectedPath: TreePath;
};

export function readPlanSpeedDialMenuState({
  actionsAreAvailable,
  selectedNodes,
  selectedPath,
}: ReadPlanSpeedDialMenuStateProps): PlanSpeedDialMenuState {
  const selectedNagger = selectedNodes.nagger;

  return {
    canCreateNagger: actionsAreAvailable,
    canEditNagger: actionsAreAvailable && selectedNagger !== null,
    canPinNagger:
      actionsAreAvailable && selectedNagger !== null && treeSelection.canBePinned(selectedPath),
    canUnpinNagger:
      actionsAreAvailable && selectedNagger !== null && treeSelection.canBeUnpinned(selectedPath),
    selectedNagger,
  };
}
