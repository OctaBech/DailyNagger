import type { ActionSending, Sending } from "@/services/sending";
import type { CommandTraceKey } from "./commandTraceKey";

type CreateCommandScopedSendingInput = {
  readonly commandTraceKey: CommandTraceKey;
  readonly sending: Sending;
};

export function createCommandScopedSending({
  commandTraceKey,
  sending,
}: CreateCommandScopedSendingInput): ActionSending {
  return {
    ...sending,
    queue: (content) => sending.queue(content, { commandTraceKey }),
  };
}
