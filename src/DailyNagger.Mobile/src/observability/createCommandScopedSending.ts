import type { ActionSending, Sending } from "@/services/sending";
import type { ObservabilityContext } from "./observabilityContext";

type CreateCommandScopedSendingInput = {
  readonly observabilityContext: ObservabilityContext;
  readonly sending: Sending;
};

export function createCommandScopedSending({
  observabilityContext,
  sending,
}: CreateCommandScopedSendingInput): ActionSending {
  return {
    ...sending,
    queue: (content) => sending.queue(content, { observabilityContext }),
  };
}
