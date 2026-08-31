import type { Nagger, Tree } from "@/models";
import type { Memory } from "@/services/memory";
import type { CultureSettings } from "@/services/culture";
import { closeTaskLogForRollover, rolloverNagger } from "@/services/actions";
import type { Sending } from "@/services/sending";
import { useEffect } from "react";
import { appTiming } from "@/config";
import { useRefLatestValue } from "@/shared";
import { recordRolloverOperation, sendingWithObservability } from "@/observability";

export type Rollover = ReturnType<typeof useRollover>;

export const useRollover = (
  cultureSettings: CultureSettings,
  planMemory: Memory,
  editorMemory: Memory,
  sending: Sending,
) => {
  const contextRef = useRefLatestValue({ cultureSettings, planMemory, editorMemory, sending });

  useEffect(() => {
    if (planMemory.state.tree === null) return;

    const run = () => void rolloverDueNaggers(contextRef.current);

    run();
    const timerId = setInterval(run, appTiming.rollover.checkIntervalMs);

    return () => clearInterval(timerId);
  }, [contextRef, planMemory.state.tree]);

  return {
    rolloverDueNaggers: () => rolloverDueNaggers(contextRef.current),
  };
};

type RolloverDueNaggersProps = {
  planMemory: Memory;
  editorMemory: Memory;
  cultureSettings: CultureSettings;
  sending: Sending;
};

async function rolloverDueNaggers(props: RolloverDueNaggersProps): Promise<void> {
  const { planMemory, editorMemory, cultureSettings, sending } = props;

  const tree = readTreeOrNull(planMemory);
  if (tree === null) return;
  if (editorMemory.state.tree !== null) return;

  const naggers = tree.nags;

  for (const nagger of naggers) {
    if (isNaggerOverdue(nagger, cultureSettings) === false) continue;

    // Do not rollover a Nagger if it has pending server updates
    if (sending.hasUpdateBelongingTo("nagger", nagger.id)) continue;

    // Do not rollover a nagger if its TaskLog has pending server updates
    if (sending.hasUpdateBelongingTo("task-log", nagger.taskLog.id)) continue;

    closeTaskLogForRollover(
      {
        cultureSettings,
        planMemory,
        sending: sendingWithObservability({
          observability: recordRolloverOperation({
            key: `task-log:${nagger.taskLog.id}/rollover-close`,
            label: "Closed task log for rollover",
            operation: "close-task-log",
          }),
          sending,
        }),
      },
      nagger,
    );
    rolloverNagger(
      {
        cultureSettings,
        planMemory,
        sending: sendingWithObservability({
          observability: recordRolloverOperation({
            key: `nagger:${nagger.id}/rollover`,
            label: "Rolled over nagger",
            operation: "nagger",
          }),
          sending,
        }),
      },
      nagger,
    );

    await yieldToUi();
  }
}

function readTreeOrNull(memory: Memory): Tree | null {
  try {
    return memory.read.getTree();
  } catch {
    return null;
  }
}

function isNaggerOverdue(nagger: Nagger, cultureSettings: CultureSettings): boolean {
  if (nagger.activeLogDueOn === null) return false;

  const expiresAt = getNaggerExpiresAt(nagger.activeLogDueOn, cultureSettings);
  return expiresAt.getTime() < cultureSettings.getNow().getTime();
}

function getNaggerExpiresAt(activeLogDueOn: string, cultureSettings: CultureSettings): Date {
  const expiresAt = cultureSettings.parseLocalIsoDate(activeLogDueOn);

  expiresAt.setDate(expiresAt.getDate() + 1);

  const [hours, minutes] = appTiming.rollover.dayBoundaryTime.split(":");
  expiresAt.setHours(Number(hours), Number(minutes), 0, 0);
  expiresAt.setMinutes(expiresAt.getMinutes() - 1);

  return expiresAt;
}

function yieldToUi() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}
