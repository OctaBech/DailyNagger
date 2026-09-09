import { createRequiredContext, type Prettify } from "@/shared";
import type { RegisteredActionClient, editorScreenActionRegistry } from "@/services/action-boundary";

export type EditorScreenActions = Prettify<RegisteredActionClient<typeof editorScreenActionRegistry>>;

export const {
  Provider: EditorScreenActionsProvider,
  useRequiredContext: useEditorScreenActions,
} = createRequiredContext<EditorScreenActions>("EditorScreenActionsContext");

type UseCreateEditorScreenActionsProps = {
  readonly registeredActions: EditorScreenActions;
};

export function useCreateEditorScreenActions({
  registeredActions,
}: UseCreateEditorScreenActionsProps): EditorScreenActions {
  return registeredActions;
}

