import type { Nagger, TaskEntry, TaskLog, UserMood } from "@/models";
import type { SendApiRequestError } from "@/api/client/sendApiRequest";
import { z } from "zod";
import { formulaSchema, stampSchema, type Formula, type Stamp } from "../contracts";
import type { MergedParcelVersioning } from "../parcelVersioning";
import type { ParcelQueueMiddlewareContext } from "./middleware";

export type SendableContent = Nagger | TaskLog | TaskEntry | UserMood;

export type Parcel = {
  readonly formula: Formula;
  readonly stamp: Stamp;
};

export const parcelSchema = z
  .object({
    formula: formulaSchema,
    stamp: stampSchema,
  })
  .passthrough();

export type ParcelBatch = {
  readonly parcels: readonly Parcel[];
  readonly middlewareContexts: readonly ParcelQueueMiddlewareContext[];
  readonly versioning: MergedParcelVersioning;
};

export type ParcelBatchScheduleDelay = "debounced" | "lostConnectionBackoff" | "immediate";

export type ParcelQueueInstruction =
  | "remove-active-batch-and-drain-next"
  | "remove-active-batch-and-stop"
  | "keep-active-batch-and-backoff"
  | "keep-active-batch-and-stop";

export type ProcessNextParcelBatchOptions = {
  readonly drain?: boolean;
};

export type SendParcelBatch = (batch: ParcelBatch) => Promise<ParcelQueueInstruction>;

export type SendBatchResult =
  | { readonly kind: "sent" }
  | {
      readonly kind: "server-rejected-current-version";
      readonly error: SendApiRequestError;
      readonly serverVersion: number;
    }
  | { readonly kind: "server-rejected-unrepairable-update"; readonly error: SendApiRequestError }
  | { readonly kind: "failed-to-connect"; readonly error: unknown };
