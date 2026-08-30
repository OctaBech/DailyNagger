import * as Sentry from "@sentry/react-native";
import { buildCausalityKeyAttributes } from "./causalityKeyList";

type ApiRequestObservability = {
  readonly causalityKeys?: readonly string[];
};

type ApiRequestDetails = {
  readonly method: string;
  readonly path: string;
  readonly requestId: string;
  readonly url: string;
};

export async function recordApiRequest<TResult>(
  observability: ApiRequestObservability | undefined,
  details: ApiRequestDetails,
  run: () => Promise<TResult>,
): Promise<TResult> {
  const result = await Sentry.withScope<Promise<TResult>>(async (scope) => {
    scope.setTag("requestId", details.requestId);
    scope.setContext("apiRequest", {
      causalityKeys: observability?.causalityKeys,
      method: details.method,
      path: details.path,
      requestId: details.requestId,
      url: details.url,
    });
    scope.addBreadcrumb({
      category: "http",
      data: {
        causalityKeys: observability?.causalityKeys,
        method: details.method,
        path: details.path,
        requestId: details.requestId,
        url: details.url,
      },
      level: "info",
      message: `${details.method} ${details.path}`,
      type: "http",
    });

    return Sentry.startSpan(
      {
        attributes: {
          ...buildCausalityKeyAttributes(observability?.causalityKeys),
          "http.method": details.method,
          "http.url": details.url,
          requestId: details.requestId,
        },
        forceTransaction: true,
        name: `${details.method} ${details.path}`,
        op: "http.client",
      },
      async () => {
        try {
          return await run();
        } catch (error) {
          Sentry.captureException(error);
          throw error;
        }
      },
    );
  });

  if (result === undefined) {
    throw new Error(
      `Sentry scope returned no API request result. ${details.method} ${details.path}`,
    );
  }

  return result;
}

export function recordSentryTraceHeader(): string | null {
  const span = Sentry.getActiveSpan();

  if (span === undefined) return null;

  const spanContext = span.spanContext();
  const sampled = spanContext.traceFlags === 1 ? "1" : "0";

  return `${spanContext.traceId}-${spanContext.spanId}-${sampled}`;
}
