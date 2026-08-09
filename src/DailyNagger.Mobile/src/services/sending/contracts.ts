import type { Guid, JsonValue } from "@/shared";
import type { ClientIdentity } from "@/models/clientIdentity";
import type { UserMoodLabel } from "@/models";
import { z } from "zod";

export type OwnerType = "nagger" | "task-log";

export type ResponseHandlingType = "none";

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

const clientIdentitySchema = z.object({
  clientId: z.string(),
  deviceName: z.string(),
  deviceModel: z.string(),
}) satisfies z.ZodType<ClientIdentity>;

export const formulaSchema = z.object({
  type: z.string(),
  label: z.string(),
  ownerType: z.enum(["nagger", "task-log", "none"]),
  ownerId: z.union([z.string() as z.ZodType<Guid>, z.null()]),
  coalesceKey: z.string(),
  canBatch: z.boolean(),
  sendMethod: z.enum(["PATCH", "PUT", "POST"]),
  endpointPath: z.string(),
  recipientExpectsVersioning: z.boolean(),
  payload: jsonValueSchema,
});

export const stampSchema = z.object({
  parcelId: z.string() as z.ZodType<Guid>,
  queuedAt: z.iso.datetime(),
  mood: z.union([z.string() as z.ZodType<UserMoodLabel>, z.null()]).optional(),
  baseVersion: z.number().optional(),
  nextVersion: z.number().optional(),
  clientIdentity: clientIdentitySchema,
  skipPayloadVersionValidation: z.boolean().optional(),
});

export const parcelSchema = z.object({
  formula: formulaSchema,
  stamp: stampSchema,
});

export type Formula = z.infer<typeof formulaSchema>;

export type Stamp = z.infer<typeof stampSchema>;

export type Parcel = z.infer<typeof parcelSchema>;

export type SendingEventType =
  | "parcel-queued"
  | "parcel-coalesced"
  | "batch-sent"
  | "batch-rejected-current-version"
  | "batch-rejected-unrepairable"
  | "batch-failed-to-connect"
  | "batch-forced"
  | "batch-discarded";

export type ServerConfrontationPrompt = {
  readonly title: string;
  readonly message: string;
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel?: string;
  readonly technicalMessage: string;
};
