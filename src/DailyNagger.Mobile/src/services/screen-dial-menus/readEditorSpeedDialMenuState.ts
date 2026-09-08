import { treeSelection, type Nagger, type SelectedNodes, type TreePath } from "@/models";

export type EditorSpeedDialMenuState = {
  readonly canCancelEdit: boolean;
  readonly canDeleteSelectedNode: boolean;
  readonly canMoveSelectedNodeDown: boolean;
  readonly canMoveSelectedNodeUp: boolean;
  readonly canPinNagger: boolean;
  readonly canSaveEdit: boolean;
  readonly canUnpinNagger: boolean;
  readonly deleteContext: ReturnType<typeof treeSelection.tryReadDeleteContext>;
  readonly moveContext: ReturnType<typeof treeSelection.tryReadMoveContext>;
  readonly selectedNagger: Nagger | null;
};

type ReadEditorSpeedDialMenuStateProps = {
  readonly selectedNodes: SelectedNodes;
  readonly selectedPath: TreePath;
};

export function readEditorSpeedDialMenuState({
  selectedNodes,
  selectedPath,
}: ReadEditorSpeedDialMenuStateProps): EditorSpeedDialMenuState {
  const selectedNagger = selectedNodes.nagger;
  const moveContext = treeSelection.tryReadMoveContext(selectedPath);
  const deleteContext = treeSelection.tryReadDeleteContext(selectedPath);

  return {
    canCancelEdit: selectedNagger !== null,
    canDeleteSelectedNode: deleteContext !== null,
    canMoveSelectedNodeDown: treeSelection.canMoveSelectedContextDown(moveContext),
    canMoveSelectedNodeUp: treeSelection.canMoveSelectedContextUp(moveContext),
    canPinNagger: selectedNagger !== null && treeSelection.canSelectedNaggerBePinned(selectedNodes),
    canSaveEdit: selectedNagger !== null,
    canUnpinNagger:
      selectedNagger !== null && treeSelection.canSelectedNaggerBeUnpinned(selectedNodes),
    deleteContext,
    moveContext,
    selectedNagger,
  };
}
