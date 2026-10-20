import { useMemo } from "react";
import { treeSelection, type SelectedNodes, type TreePath } from "@/models";
import type { Guid } from "@/shared";
import type { ProxyActions, planDialActionRegistry } from "@/services/action-boundary";
import { createDialMenuBuilder, type SpeedDialMenu } from "@/components/speed-dial";

type PlanDialProxyActions = ProxyActions<typeof planDialActionRegistry>["dial"];

type UseCreatePlanScreenDialMenuProps = {
  readonly planDialProxyActions: PlanDialProxyActions;
  readonly actionsAreAvailable: boolean;
  readonly selectedNodes: SelectedNodes;
  readonly selectedPath: TreePath;
  readonly onCreateNagger: () => void;
  readonly onEditNagger: (naggerId: Guid) => void;
};

export function useCreatePlanScreenDialMenu({
  planDialProxyActions,
  actionsAreAvailable,
  selectedNodes,
  selectedPath,
  onCreateNagger,
  onEditNagger,
}: UseCreatePlanScreenDialMenuProps): SpeedDialMenu {
  const { nagger } = selectedNodes;
  const { pinSelectedNagger, unpinSelectedNagger } = planDialProxyActions;

  return useMemo(() => {
    if (!actionsAreAvailable) return { items: [] };

    const builder = createDialMenuBuilder();
    builder.addOption({
      row: "new",
      key: "plan.new-nagger",
      iconType: "vector",
      iconValue: "bell-plus",
      label: "New nagger",
      showLabel: true,
      onSelect: onCreateNagger,
    });

    if (nagger === null) return { items: builder.getMenuArray() };

    if (treeSelection.canBePinned(selectedPath)) {
      builder.addOption({
        row: "new",
        key: "plan.pin-selected-nagger",
        iconType: "vector",
        iconValue: "pin",
        label: "Pin",
        showLabel: true,
        onSelect: () => pinSelectedNagger({ nagger }),
      });
    }

    if (treeSelection.canBeUnpinned(selectedPath)) {
      builder.addOption({
        row: "new",
        key: "plan.unpin-selected-nagger",
        iconType: "vector",
        iconValue: "pin-off",
        label: "Unpin",
        showLabel: true,
        onSelect: () => unpinSelectedNagger({ nagger }),
      });
    }

    builder.addOption({
      row: "new",
      key: "plan.edit-selected-nagger",
      iconType: "vector",
      iconValue: "pencil-box-outline",
      label: "Edit nagger",
      showLabel: true,
      onSelect: () => onEditNagger(nagger.id),
    });
    return { items: builder.getMenuArray() };
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
