import type { SelectedMoveContext } from "@/models";
import type { EditorActionScope } from "./contracts";
import { moveSelectedNode } from "./moveSelectedNode";

export function editorMoveSelectedNodeUp(
  scope: EditorActionScope,
  moveContext: SelectedMoveContext,
): void {
  moveSelectedNode(scope, moveContext, "up");
}
