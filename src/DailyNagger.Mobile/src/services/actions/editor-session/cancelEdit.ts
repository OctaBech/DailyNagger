import type { EditorSessionRuntimeDependencies } from "./contracts";

export function editorCancelEdit(
  _args: {
    readonly nagger: unknown;
  },
  { editorMemory, undoHistory }: EditorSessionRuntimeDependencies,
): void {
  undoHistory.clear();
  editorMemory.write.clear();
}
