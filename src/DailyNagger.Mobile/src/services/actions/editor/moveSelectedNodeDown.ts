import type { SelectedMoveContext } from "@/models";
import type { EditorRuntimeDependencies } from "./contracts";
import { moveSelectedNode } from "./moveSelectedNode";

export function editorMoveSelectedNodeDown(
  args: {
    readonly moveContext: SelectedMoveContext;
  },
  runtimeDependencies: EditorRuntimeDependencies,
): void {
  moveSelectedNode(args, runtimeDependencies, "down");
}
