import type { ActionSending, Sending } from "@/services/sending";
import type { Observability } from "./observabilityContext";

type SendingWithObservabilityInput = {
  readonly observability: Observability;
  readonly sending: Sending;
};

export function sendingWithObservability({
  observability,
  sending,
}: SendingWithObservabilityInput): ActionSending {
  return {
    ...sending,
    queue: (content) => sending.queue(content, { observability }),
  };
}
