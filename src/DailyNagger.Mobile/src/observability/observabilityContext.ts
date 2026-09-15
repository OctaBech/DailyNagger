import type { Guid } from "@/shared";

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
