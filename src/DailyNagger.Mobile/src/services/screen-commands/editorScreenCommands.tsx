import { createRequiredContext, type Prettify } from "@/shared";
import type { RegisteredActionClient, editorScreenActionRegistry } from "@/services/action-boundary";

export type EditorScreenCommands = Prettify<RegisteredActionClient<typeof editorScreenActionRegistry>>;

export const {
  Provider: EditorScreenCommandsProvider,
  useRequiredContext: useEditorScreenCommands,
} = createRequiredContext<EditorScreenCommands>("EditorScreenCommandsContext");

type UseCreateEditorScreenCommandsProps = {
  readonly registeredActions: EditorScreenCommands;
};

export function useCreateEditorScreenCommands({
  registeredActions,
}: UseCreateEditorScreenCommandsProps): EditorScreenCommands {
  return registeredActions;
}
