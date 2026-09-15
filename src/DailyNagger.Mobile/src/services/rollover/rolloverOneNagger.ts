import { rolloverActions } from "@/services/actions";
import type { CultureSettings } from "@/services/culture";
import type { Memory } from "@/services/memory";
import type { Sending } from "@/services/sending";
import type { Nagger } from "@/models";

type RolloverOneNaggerProps = {
  readonly cultureSettings: CultureSettings;
  readonly planMemory: Memory;
  readonly sending: Sending;
};

export function rolloverOneNagger(
  { cultureSettings, planMemory, sending }: RolloverOneNaggerProps,
  nagger: Nagger,
): void {
  rolloverActions.closeTaskLogForRollover(
    {
      cultureSettings,
      planMemory,
      sending,
    },
    nagger,
  );
  rolloverActions.rolloverNagger(
    {
      cultureSettings,
      planMemory,
      sending,
    },
    nagger,
  );
}
