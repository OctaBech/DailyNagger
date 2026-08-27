import type { SendApiRequest } from "@/api/client/sendApiRequest";
import type { Formula } from "../contracts";

export function logSendingRequest(
  request: SendApiRequest,
  ownerType: Formula["ownerType"],
  ownerId: string | null,
): void {
  if (!__DEV__) return;

  console.info("Sending queued update", {
    sendMethod: request.method,
    endpointPath: request.endpoint,
    commandTraceKeys: request.processing.commandTraceKeys,
    baseVersion: request.processing.baseVersion,
    nextVersion: request.processing.nextVersion,
    skipPayloadVersionValidation: request.processing.skipPayloadVersionValidation,
    ownerType,
    ownerId,
    clientIdentity: request.processing.clientIdentity,
    payload: request.payload,
  });
}
