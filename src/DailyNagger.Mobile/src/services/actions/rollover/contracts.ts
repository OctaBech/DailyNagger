import type { CultureSettings } from "@/services/culture";
import type { Memory } from "@/services/memory";
import type { Sending } from "@/services/sending";

export type RolloverActionScope = {
  readonly cultureSettings: CultureSettings;
  readonly planMemory: Memory;
  readonly sending: Sending;
};


