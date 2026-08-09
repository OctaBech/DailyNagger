import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Memory } from "../contracts";
import { selectedPathOperations } from "../core-tree-operations";
import type { Prettify } from "@/shared";
import type { CultureSettings } from "../culture";
import { scheduleCalculator } from "../schedule-calculator";
import type { Nagger, ScheduleRule } from "@/models";

type UseCreateEditorScreenDataProps = {
  readonly editorMemory: Memory;
  readonly cultureSettings: CultureSettings;
};

export type EditorScreenData = Prettify<ReturnType<typeof useCreateEditorScreenData>>;

const EditorScreenDataContext = createContext<EditorScreenData | null>(null);

type EditorScreenDataProviderProps = {
  readonly value: EditorScreenData;
  readonly children: ReactNode;
};

export function EditorScreenDataProvider({ value, children }: EditorScreenDataProviderProps) {
  return (
    <EditorScreenDataContext.Provider value={value}>{children}</EditorScreenDataContext.Provider>
  );
}

export function useEditorScreenData(): EditorScreenData {
  const editorScreenData = useContext(EditorScreenDataContext);

  if (editorScreenData === null) {
    throw new Error("EditorScreenDataContext is missing.");
  }

  return editorScreenData;
}

export function useCreateEditorScreenData({
  editorMemory,
  cultureSettings,
}: UseCreateEditorScreenDataProps) {
  const { tree, selectedPath } = editorMemory.state;

  return useMemo(
    () => ({
      tree,
      selectedPath,
      selectedNodes: selectedPathOperations.deriveSelectedNodes(selectedPath),
      schedule: {
        getNextDueOn: (nagger: Nagger, scheduleRules: readonly ScheduleRule[]) =>
          scheduleCalculator.getNextDueOn({ ...nagger, scheduleRules }, cultureSettings),
      },
    }),
    [cultureSettings, selectedPath, tree],
  );
}
