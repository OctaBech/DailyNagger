import type { CultureSettings, Memory } from "../../contracts";

export type EditorActionScope = {
  readonly cultureSettings: CultureSettings;
  readonly memory: Memory;
};
