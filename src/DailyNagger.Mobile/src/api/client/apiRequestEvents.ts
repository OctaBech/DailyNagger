import { createEventEmitter } from "@/shared";

export type ApiRequestEventType =
  "api.request.started" | "api.request.finished" | "api.request.failed";

export type ApiRequestEvent = {
  readonly durationMs?: number;
  readonly error?: unknown;
  readonly method: string;
  readonly path: string;
  readonly requestId: string;
  readonly status?: number;
};

export const apiRequestEvents = createEventEmitter<ApiRequestEventType, ApiRequestEvent>();
