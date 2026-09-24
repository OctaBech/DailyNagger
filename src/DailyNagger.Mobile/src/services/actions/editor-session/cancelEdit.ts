import type { EditorSessionRuntimeDependencies } from "./contracts";

export function editorCancelEdit(
  _args: {
    readonly nagger: unknown;
  },
  { editorMemory }: EditorSessionRuntimeDependencies,
): void {
  editorMemory.write.clear();
}
