import type { Guid, JsonValue } from "@/shared";
import type { ClientIdentity } from "@/models/clientIdentity";
import type { UserMoodLabel } from "@/models";
import type { Observability, ObservabilityContext, SpanContinuation } from "@/observability";
import { recordLegacyObservability } from "@/observability";
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

const observabilityContextSchema = z.object({
  causality: z.object({
    id: z.string() as z.ZodType<Guid>,
    key: z.string(),
    kind: z.string(),
    label: z.string(),
    occurredAt: z.iso.datetime(),
    source: z.string(),
  }),
}) satisfies z.ZodType<ObservabilityContext>;

const spanContinuationSchema = z.object({
  baggage: z.string().nullable(),
  sentryTrace: z.string(),
}) satisfies z.ZodType<SpanContinuation>;

const parcelObservabilitySchema = z.object({
  context: observabilityContextSchema,
  causalityKeys: z.array(z.string()),
  spanContinuation: spanContinuationSchema.nullable().optional().default(null),
}) satisfies z.ZodType<Observability>;

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

const persistedStampSchema = z.object({
  parcelId: z.string() as z.ZodType<Guid>,
  queuedAt: z.iso.datetime(),
  mood: z.union([z.string() as z.ZodType<UserMoodLabel>, z.null()]).optional(),
  causalityKeys: z.array(z.string()).optional(),
  commandTraceKeys: z.array(z.string()).optional(),
  baseVersion: z.number().optional(),
  nextVersion: z.number().optional(),
  clientIdentity: clientIdentitySchema,
  skipPayloadVersionValidation: z.boolean().optional(),
});

export const stampSchema = persistedStampSchema.transform(
  ({ commandTraceKeys, causalityKeys, ...stamp }) => stamp,
);

export const parcelSchema = z
  .object({
    formula: formulaSchema,
    observability: parcelObservabilitySchema.optional(),
    stamp: persistedStampSchema,
  })
  .transform(({ observability, stamp, ...parcel }) => {
    const { commandTraceKeys, causalityKeys, ...normalizedStamp } = stamp;

    return {
      ...parcel,
      observability:
        observability ?? recordLegacyObservability(causalityKeys ?? commandTraceKeys ?? []),
      stamp: normalizedStamp,
    };
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
