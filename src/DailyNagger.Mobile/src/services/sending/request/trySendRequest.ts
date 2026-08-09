import {
  SendApiRequestError,
  sendApiRequest,
  type SendApiRequest,
} from "@/api/client/sendApiRequest";

export type SendBatchResult =
  | { readonly kind: "sent" }
  | {
      readonly kind: "server-rejected-current-version";
      readonly error: SendApiRequestError;
      readonly serverVersion: number;
    }
  | { readonly kind: "server-rejected-unrepairable-update"; readonly error: SendApiRequestError }
  | { readonly kind: "failed-to-connect"; readonly error: unknown };

export async function trySendRequest(request: SendApiRequest): Promise<SendBatchResult> {
  try {
    await sendApiRequest(request);
    return { kind: "sent" };
  } catch (error) {
    if (serverRejectedCurrentVersion(error)) {
      if (error.currentVersion === null) {
        return { kind: "server-rejected-unrepairable-update", error };
      }

      return { kind: "server-rejected-current-version", error, serverVersion: error.currentVersion };
    }

    if (serverRejectedUnrepairableUpdate(error)) {
      return { kind: "server-rejected-unrepairable-update", error };
    }

    return { kind: "failed-to-connect", error };
  }
}

function serverRejectedCurrentVersion(error: unknown): error is SendApiRequestError {
  return error instanceof SendApiRequestError && error.status === 409;
}

function serverRejectedUnrepairableUpdate(error: unknown): error is SendApiRequestError {
  if (!(error instanceof SendApiRequestError)) return false;
  return error.status === 400 || error.status === 404;
}
