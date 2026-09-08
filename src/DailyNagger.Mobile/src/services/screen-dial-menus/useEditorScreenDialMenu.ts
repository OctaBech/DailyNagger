import { useMemo } from "react";
import type { SelectedNodes, TreePath } from "@/models";
import type { EditorScreenCommands } from "../screen-commands";
import type { SpeedDialMenu } from "./SpeedDialMenu";
import { readEditorSpeedDialMenuState } from "./readEditorSpeedDialMenuState";

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
    const menuState = readEditorSpeedDialMenuState({ selectedNodes, selectedPath });
    const { deleteContext, moveContext, selectedNagger } = menuState;

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
          isDisabled: !menuState.canMoveSelectedNodeUp,
          onSelect: () => {
            if (moveContext === null) return;
            if (!menuState.canMoveSelectedNodeUp) return;
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
          isDisabled: !menuState.canMoveSelectedNodeDown,
          onSelect: () => {
            if (moveContext === null) return;
            if (!menuState.canMoveSelectedNodeDown) return;
            moveSelectedNodeDown(moveContext);
          },
        },
        ...(menuState.canPinNagger && selectedNagger !== null
          ? [
              {
                key: "editor.pin-selected-nagger",
                iconType: "vector" as const,
                iconValue: "pin",
                label: "Pin",
                showLabel: true,
                row: 3,
                keepOpenAfterPress: true,
                onSelect: () => pinSelectedNagger(selectedNagger),
              },
            ]
          : []),
        ...(menuState.canUnpinNagger && selectedNagger !== null
          ? [
              {
                key: "editor.unpin-selected-nagger",
                iconType: "vector" as const,
                iconValue: "pin-off",
                label: "Unpin",
                showLabel: true,
                row: 3,
                keepOpenAfterPress: true,
                onSelect: () => unpinSelectedNagger(selectedNagger),
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
          isDisabled: !menuState.canDeleteSelectedNode,
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
          isDisabled: !menuState.canSaveEdit,
          onSelect: () => {
            if (selectedNagger === null) return;
            saveEdit(selectedNagger);
            onCloseEditor();
          },
        },
        {
          key: "editor.cancel",
          iconType: "vector" as const,
          iconValue: "close",
          label: "Cancel",
          row: 0,
          isDisabled: !menuState.canCancelEdit,
          onSelect: () => {
            if (selectedNagger === null) return;
            cancelEdit(selectedNagger);
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
    unpinSelectedNagger,
  ]);
}
