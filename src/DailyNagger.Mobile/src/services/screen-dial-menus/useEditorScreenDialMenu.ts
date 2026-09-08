import { useMemo } from "react";
import { treeSelection, type SelectedNodes, type TreePath } from "@/models";
import type { EditorScreenCommands } from "../screen-commands";
import type { SpeedDialMenu } from "./SpeedDialMenu";

type UseCreateEditorScreenDialMenuProps = {
  readonly editorCommands: EditorScreenCommands;
  readonly selectedNodes: SelectedNodes;
  readonly selectedPath: TreePath;
  readonly onCloseEditor: () => void;
};

export function useCreateEditorScreenDialMenu({
  editorCommands,
  selectedNodes,
  selectedPath,
  onCloseEditor,
}: UseCreateEditorScreenDialMenuProps): SpeedDialMenu {
  const { nagger } = selectedNodes;
  const {
    cancelEdit,
    deleteSelectedNode,
    moveSelectedNodeDown,
    moveSelectedNodeUp,
    pinSelectedNagger,
    saveEdit,
    unpinSelectedNagger,
  } = editorCommands.dial;

  return useMemo(() => {
    const moveContext = treeSelection.tryReadMoveContext(selectedPath);
    const deleteContext = treeSelection.tryReadDeleteContext(selectedPath);

    return {
      items: [
        {
          key: "editor.move-selected-up",
          iconType: "vector" as const,
          iconValue: "arrow-up",
          label: "Move up/down",
          showLabel: true,
          row: 1,
          keepOpenAfterPress: true,
          isDisabled: !treeSelection.canMoveSelectedContextUp(moveContext),
          onSelect: () => {
            if (moveContext === null) return;
            if (!treeSelection.canMoveSelectedContextUp(moveContext)) return;
            moveSelectedNodeUp(moveContext);
          },
        },
        {
          key: "editor.move-selected-down",
          iconType: "vector" as const,
          iconValue: "arrow-down",
          label: "Move down",
          row: 1,
          keepOpenAfterPress: true,
          isDisabled: !treeSelection.canMoveSelectedContextDown(moveContext),
          onSelect: () => {
            if (moveContext === null) return;
            if (!treeSelection.canMoveSelectedContextDown(moveContext)) return;
            moveSelectedNodeDown(moveContext);
          },
        },
        ...(treeSelection.canSelectedNaggerBePinned(selectedNodes) && nagger !== null
          ? [
              {
                key: "editor.pin-selected-nagger",
                iconType: "vector" as const,
                iconValue: "pin",
                label: "Pin",
                showLabel: true,
                row: 3,
                keepOpenAfterPress: true,
                onSelect: () => pinSelectedNagger(nagger),
              },
            ]
          : []),
        ...(treeSelection.canSelectedNaggerBeUnpinned(selectedNodes) && nagger !== null
          ? [
              {
                key: "editor.unpin-selected-nagger",
                iconType: "vector" as const,
                iconValue: "pin-off",
                label: "Unpin",
                showLabel: true,
                row: 3,
                keepOpenAfterPress: true,
                onSelect: () => unpinSelectedNagger(nagger),
              },
            ]
          : []),
        {
          key: "editor.delete-selected-node",
          iconType: "vector" as const,
          iconValue: "delete",
          label: "Delete",
          showLabel: true,
          row: 2,
          keepOpenAfterPress: true,
          isDisabled: deleteContext === null,
          onSelect: () => {
            if (deleteContext === null) return;
            deleteSelectedNode(deleteContext);
          },
        },
        {
          key: "editor.save",
          iconType: "vector" as const,
          iconValue: "content-save",
          label: "Save",
          row: 0,
          isDisabled: nagger === null,
          onSelect: () => {
            if (nagger === null) return;
            saveEdit(nagger);
            onCloseEditor();
          },
        },
        {
          key: "editor.cancel",
          iconType: "vector" as const,
          iconValue: "close",
          label: "Cancel",
          row: 0,
          isDisabled: nagger === null,
          onSelect: () => {
            if (nagger === null) return;
            cancelEdit(nagger);
            onCloseEditor();
          },
        },
      ],
    };
  }, [
    cancelEdit,
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
