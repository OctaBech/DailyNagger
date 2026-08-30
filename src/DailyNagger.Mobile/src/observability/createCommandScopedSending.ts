import type { ActionSending, Sending } from "@/services/sending";
import type { Observability } from "./observabilityContext";

type CreateCommandScopedSendingInput = {
  readonly observability: Observability;
  readonly sending: Sending;
};

export function recordCommandScopedSending({
  observability,
  sending,
}: CreateCommandScopedSendingInput): ActionSending {
  return {
    ...sending,
    queue: (content) => sending.queue(content, { observability }),
  };
}
