import type { EditorSessionActionScope } from "./contracts";

export function editorCancelEdit({ editorMemory }: EditorSessionActionScope): void {
  editorMemory.write.clear();
}
