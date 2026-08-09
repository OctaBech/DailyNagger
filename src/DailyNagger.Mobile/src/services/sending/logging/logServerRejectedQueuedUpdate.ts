import { SendApiRequestError } from "@/api/client/sendApiRequest";
import type { Parcel } from "../contracts";

export function logServerRejectedQueuedUpdate(error: unknown, batch: readonly Parcel[]): void {
  if (!(error instanceof SendApiRequestError)) return;

  console.error("Server rejected queued update", {
    status: error.status,
    responseBody: error.responseBody,
    batch,
  });
}
