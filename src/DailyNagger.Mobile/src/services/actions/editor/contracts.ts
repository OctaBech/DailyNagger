import type { CultureSettings, Memory } from "../../contracts";

export type EditorRuntimeDependencies = {
  readonly cultureSettings: CultureSettings;
  readonly memory: Memory;
};

