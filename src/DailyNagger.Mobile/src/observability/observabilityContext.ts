import type { Guid } from "@/shared";
import { newGuid } from "@/shared";
import { mergeCausalityKeys } from "./causalityKeyList";

export type Causality = {
  readonly id: Guid;
  readonly key: string;
  readonly kind: string;
  readonly label: string;
  readonly occurredAt: string;
  readonly source: string;
};

export type ObservabilityContext = {
  readonly causality: Causality;
};

export type SpanContinuation = {
  readonly baggage: string | null;
  readonly sentryTrace: string;
};

export type Observability = {
  readonly context: ObservabilityContext;
  readonly causalityKeys: readonly string[];
  readonly spanContinuation: SpanContinuation | null;
};

type BuildObservabilityContextInput = {
  readonly key: string;
  readonly kind: string;
  readonly label: string;
  readonly source: string;
};

export function buildObservabilityContext({
  key,
  kind,
  label,
  source,
}: BuildObservabilityContextInput): ObservabilityContext {
  return {
    causality: {
      id: newGuid(),
      key,
      kind,
      label,
      occurredAt: new Date().toISOString(),
      source,
    },
  };
}

export function recordLegacyObservability(causalityKeys: readonly string[]): Observability {
  const key = causalityKeys[0] ?? "legacy:unknown";

  return {
    context: buildObservabilityContext({
      key,
      kind: "legacy/queued-parcel",
      label: "Legacy queued parcel",
      source: "send-queue",
    }),
    causalityKeys,
    spanContinuation: null,
  };
}

export function mergeObservability(
  primary: Observability,
  secondary: readonly Observability[],
): Observability {
  let causalityKeys = primary.causalityKeys;

  for (const observability of secondary) {
    causalityKeys = mergeCausalityKeys(causalityKeys, observability.causalityKeys);
  }

  return {
    ...primary,
    causalityKeys,
  };
}

