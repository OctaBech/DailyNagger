import { useMemo } from "react";
import { nodeReaderOperations, selectedNodeContextOperations } from "../core-node-operations";
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
  const { selectedNodes, selectedPath } = editorScreenData;
  const { nagger, taskItem, taskLog } = selectedNodes;
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

  return useMemo(() => {
    const moveContext = selectedNodeContextOperations.tryReadMoveContext(selectedPath);
    const deleteContext = selectedNodeContextOperations.tryReadDeleteContext(selectedPath);

    return {
      items: [
        {
          key: "editor.add-comment",
          icon: "playlist-plus",
          label: "Add comment",
          showLabel: true,
          row: 4,
          keepOpenAfterPress: true,
          isDisabled: taskLog === null || taskItem === null,
          onSelect: () => {
            if (taskLog === null || taskItem === null) return;
            taskEntryAdd(taskLog, taskItem);
          },
        },
        {
          key: "editor.add-task-step",
          icon: "checkbox-marked-circle-plus-outline",
          label: "Add task step",
          showLabel: true,
          row: 5,
          keepOpenAfterPress: true,
          isDisabled: taskLog === null,
          onSelect: () => {
            if (taskLog === null) return;
            taskItemAdd(taskLog, taskItem);
          },
        },
        {
          key: "editor.move-selected-up",
          icon: "arrow-up",
          label: "Move up/down",
          showLabel: true,
          row: 1,
          keepOpenAfterPress: true,
          isDisabled: !nodeReaderOperations.canMoveSelectedContextUp(moveContext),
          onSelect: () => {
            if (moveContext === null) return;
            if (!nodeReaderOperations.canMoveSelectedContextUp(moveContext)) return;
            moveSelectedNodeUp(moveContext);
          },
        },
        {
          key: "editor.move-selected-down",
          icon: "arrow-down",
          label: "Move down",
          row: 1,
          keepOpenAfterPress: true,
          isDisabled: !nodeReaderOperations.canMoveSelectedContextDown(moveContext),
          onSelect: () => {
            if (moveContext === null) return;
            if (!nodeReaderOperations.canMoveSelectedContextDown(moveContext)) return;
            moveSelectedNodeDown(moveContext);
          },
        },
        ...(nodeReaderOperations.canSelectedNaggerBePinned(selectedNodes) && nagger !== null
          ? [
              {
                key: "editor.pin-selected-nagger",
                icon: "pin",
                label: "Pin",
                showLabel: true,
                row: 3,
                keepOpenAfterPress: true,
                onSelect: () => pinSelectedNagger(nagger),
              },
            ]
          : []),
        ...(nodeReaderOperations.canSelectedNaggerBeUnpinned(selectedNodes) && nagger !== null
          ? [
              {
                key: "editor.unpin-selected-nagger",
                icon: "pin-off",
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
          icon: "delete",
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
          icon: "content-save",
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
          icon: "close",
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
    taskEntryAdd,
    taskItem,
    taskItemAdd,
    taskLog,
    unpinSelectedNagger,
  ]);
}
