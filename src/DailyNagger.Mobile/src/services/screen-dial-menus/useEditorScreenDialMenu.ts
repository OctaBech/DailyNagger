import { useMemo } from "react";
import {
  isTaskEntry,
  isTaskItem,
  isTaskLog,
  treeSelection,
  type SelectedNodes,
  type TreePath,
} from "@/models";
import type { NodeClipboard } from "@/services/contracts";
import type { ProxyActions, editorDialActionRegistry } from "@/services/action-boundary";
import { createDialMenuBuilder, type SpeedDialMenu } from "@/components/speed-dial";

type EditorDialProxyActions = ProxyActions<typeof editorDialActionRegistry>["dial"];

type UseCreateEditorScreenDialMenuProps = {
  readonly editorDialProxyActions: EditorDialProxyActions;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly clipboardNodeType: NodeClipboard["nodeType"];
  readonly selectedNodes: SelectedNodes;
  readonly selectedPath: TreePath;
  readonly onCloseEditor: () => void;
};

export function useCreateEditorScreenDialMenu({
  editorDialProxyActions,
  canUndo,
  canRedo,
  clipboardNodeType,
  selectedNodes,
  selectedPath,
  onCloseEditor,
}: UseCreateEditorScreenDialMenuProps): SpeedDialMenu {
  const { nagger } = selectedNodes;
  const {
    cancelEdit,
    copySelectedNode,
    pasteNodeIntoTaskItem,
    pasteNodeIntoTaskLog,
    deleteSelectedNode,
    moveSelectedNodeDown,
    moveSelectedNodeUp,
    pinSelectedNagger,
    saveEdit,
    unpinSelectedNagger,
    undoEdit,
    redoEdit,
  } = editorDialProxyActions;

  return useMemo(() => {
    const moveContext = treeSelection.tryReadMoveContext(selectedPath);
    const deleteContext = treeSelection.tryReadDeleteContext(selectedPath);
    const selectedNode = treeSelection.tryGetSelectedNode(selectedPath);
    const itemTarget =
      selectedNode !== null && (isTaskItem(selectedNode) || isTaskEntry(selectedNode))
        ? selectedNode
        : null;
    const logTarget = selectedNode !== null && isTaskLog(selectedNode) ? selectedNode : null;
    const canPaste =
      clipboardNodeType !== null &&
      (itemTarget !== null || (logTarget !== null && clipboardNodeType === "TaskItem"));

    const builder = createDialMenuBuilder();
    builder.addOption({
      key: "editor.save",
      iconType: "vector",
      iconValue: "content-save",
      label: "Save",
      row: "new",
      isDisabled: nagger === null,
      onSelect: () => {
        if (nagger === null) return;
        saveEdit({ nagger });
        onCloseEditor();
      },
    });
    builder.addOption({
      key: "editor.cancel",
      iconType: "vector",
      iconValue: "close",
      label: "Cancel",
      row: "current",
      isDisabled: nagger === null,
      onSelect: () => {
        if (nagger === null) return;
        cancelEdit({ nagger });
        onCloseEditor();
      },
    });
    builder.addOption({
      key: "editor.move-selected-up",
      iconType: "vector",
      iconValue: "arrow-up",
      label: "Move up/down",
      showLabel: true,
      row: "new",
      keepOpenAfterPress: true,
      isDisabled: !treeSelection.canMoveSelectedContextUp(moveContext),
      onSelect: () => {
        if (moveContext === null) return;
        if (!treeSelection.canMoveSelectedContextUp(moveContext)) return;
        moveSelectedNodeUp({ moveContext });
      },
    });
    builder.addOption({
      key: "editor.move-selected-down",
      iconType: "vector",
      iconValue: "arrow-down",
      label: "Move down",
      row: "current",
      keepOpenAfterPress: true,
      isDisabled: !treeSelection.canMoveSelectedContextDown(moveContext),
      onSelect: () => {
        if (moveContext === null) return;
        if (!treeSelection.canMoveSelectedContextDown(moveContext)) return;
        moveSelectedNodeDown({ moveContext });
      },
    });
    builder.addOption({
      key: "editor.delete-selected-node",
      iconType: "vector",
      iconValue: "delete",
      label: "Delete",
      showLabel: true,
      row: "new",
      keepOpenAfterPress: true,
      isDisabled: deleteContext === null,
      onSelect: () => {
        if (deleteContext === null) return;
        deleteSelectedNode({ deleteContext });
      },
    });
    if (treeSelection.canSelectedNaggerBePinned(selectedNodes) && nagger !== null) {
      builder.addOption({
        key: "editor.pin-selected-nagger",
        iconType: "vector",
        iconValue: "pin",
        label: "Pin",
        showLabel: true,
        row: "new",
        keepOpenAfterPress: true,
        onSelect: () => pinSelectedNagger({ nagger }),
      });
    }
    if (treeSelection.canSelectedNaggerBeUnpinned(selectedNodes) && nagger !== null) {
      builder.addOption({
        key: "editor.unpin-selected-nagger",
        iconType: "vector",
        iconValue: "pin-off",
        label: "Unpin",
        showLabel: true,
        row: "new",
        keepOpenAfterPress: true,
        onSelect: () => unpinSelectedNagger({ nagger }),
      });
    }
    builder.addOption({
      key: "editor.copy-selected-node",
      iconType: "vector",
      iconValue: "content-copy",
      label: "Copy/paste",
      showLabel: true,
      row: "new",
      keepOpenAfterPress: true,
      isDisabled: itemTarget === null,
      onSelect: () => {
        if (itemTarget !== null) copySelectedNode({ node: itemTarget });
      },
    });
    builder.addOption({
      key: "editor.paste-selected-node",
      iconType: "vector",
      iconValue: "content-paste",
      label: "Paste",
      row: "current",
      keepOpenAfterPress: true,
      isDisabled: !canPaste,
      onSelect: () => {
        if (!canPaste) return;
        if (itemTarget !== null) {
          pasteNodeIntoTaskItem({ target: itemTarget });
        } else if (logTarget !== null) {
          pasteNodeIntoTaskLog({ target: logTarget });
        }
      },
    });
    builder.addOption({
      key: "editor.undo",
      iconType: "vector",
      iconValue: "undo",
      label: "Undo",
      row: "new",
      keepOpenAfterPress: true,
      isDisabled: !canUndo,
      onSelect: () => {
        undoEdit({});
      },
    });
    builder.addOption({
      key: "editor.redo",
      iconType: "vector",
      iconValue: "redo",
      label: "Redo",
      row: "current",
      keepOpenAfterPress: true,
      isDisabled: !canRedo,
      onSelect: () => {
        redoEdit({});
      },
    });
    return { items: builder.getMenuArray() };
  }, [
    canUndo,
    canRedo,
    clipboardNodeType,
    undoEdit,
    redoEdit,
    cancelEdit,
    copySelectedNode,
    pasteNodeIntoTaskItem,
    pasteNodeIntoTaskLog,
    deleteSelectedNode,
    moveSelectedNodeDown,
    moveSelectedNodeUp,
    onCloseEditor,
    pinSelectedNagger,
    saveEdit,
    selectedNodes,
    selectedPath,
    nagger,
    unpinSelectedNagger,
  ]);
}
