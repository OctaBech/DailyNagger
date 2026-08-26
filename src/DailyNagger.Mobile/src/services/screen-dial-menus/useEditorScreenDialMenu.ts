import { useMemo } from "react";
import { nodeReaderOperations } from "../core-node-operations";
import type { EditorScreenCommands } from "../screen-commands";
import type { EditorScreenData } from "../screen-data";
import type { SpeedDialMenu } from "./SpeedDialMenu";

type UseCreateEditorScreenDialMenuProps = {
  readonly editorCommands: EditorScreenCommands;
  readonly editorScreenData: EditorScreenData;
  readonly onCloseEditor: () => void;
};

export function useCreateEditorScreenDialMenu({
  editorCommands,
  editorScreenData,
  onCloseEditor,
}: UseCreateEditorScreenDialMenuProps): SpeedDialMenu {
  const { selectedPath } = editorScreenData;
  const {
    cancelEdit,
    deleteSelectedNode,
    moveSelectedNodeDown,
    moveSelectedNodeUp,
    pinSelectedNagger,
    saveEdit,
    taskEntryAdd,
    taskItemAdd,
    unpinSelectedNagger,
  } = editorCommands.dial;

  return useMemo(
    () => ({
      items: [
        {
          key: "editor.add-comment",
          icon: "playlist-plus",
          label: "Add comment",
          showLabel: true,
          row: 4,
          keepOpenAfterPress: true,
          isDisabled: !nodeReaderOperations.canAddTaskEntryToSelectedNode(selectedPath),
          onSelect: taskEntryAdd,
        },
        {
          key: "editor.add-task-step",
          icon: "checkbox-marked-circle-plus-outline",
          label: "Add task step",
          showLabel: true,
          row: 5,
          keepOpenAfterPress: true,
          onSelect: taskItemAdd,
        },
        {
          key: "editor.move-selected-up",
          icon: "arrow-up",
          label: "Move up/down",
          showLabel: true,
          row: 1,
          keepOpenAfterPress: true,
          isDisabled: !nodeReaderOperations.canMoveSelectedNodeUp(selectedPath),
          onSelect: moveSelectedNodeUp,
        },
        {
          key: "editor.move-selected-down",
          icon: "arrow-down",
          label: "Move down",
          row: 1,
          keepOpenAfterPress: true,
          isDisabled: !nodeReaderOperations.canMoveSelectedNodeDown(selectedPath),
          onSelect: moveSelectedNodeDown,
        },
        ...(nodeReaderOperations.canBePinned(selectedPath)
          ? [
              {
                key: "editor.pin-selected-nagger",
                icon: "pin",
                label: "Pin",
                showLabel: true,
                row: 3,
                keepOpenAfterPress: true,
                onSelect: pinSelectedNagger,
              },
            ]
          : []),
        ...(nodeReaderOperations.canBeUnpinned(selectedPath)
          ? [
              {
                key: "editor.unpin-selected-nagger",
                icon: "pin-off",
                label: "Unpin",
                showLabel: true,
                row: 3,
                keepOpenAfterPress: true,
                onSelect: unpinSelectedNagger,
              },
            ]
          : []),
        {
          key: "editor.delete-selected-node",
          icon: "delete",
          label: "Delete",
          showLabel: true,
          row: 2,
          keepOpenAfterPress: true,
          isDisabled: !nodeReaderOperations.canDeleteSelectedNode(selectedPath),
          onSelect: deleteSelectedNode,
        },
        {
          key: "editor.save",
          icon: "content-save",
          label: "Save",
          row: 0,
          onSelect: () => {
            saveEdit();
            onCloseEditor();
          },
        },
        {
          key: "editor.cancel",
          icon: "close",
          label: "Cancel",
          row: 0,
          onSelect: () => {
            cancelEdit();
            onCloseEditor();
          },
        },
      ],
    }),
    [
      cancelEdit,
      deleteSelectedNode,
      moveSelectedNodeDown,
      moveSelectedNodeUp,
      onCloseEditor,
      pinSelectedNagger,
      saveEdit,
      selectedPath,
      taskEntryAdd,
      taskItemAdd,
      unpinSelectedNagger,
    ],
  );
}
