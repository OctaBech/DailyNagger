import * as Sentry from "@sentry/react-native";
import { getActiveCausalityKey } from "./getActiveCausalityKey";
import { spanAttributeKeys } from "./spanAttributeKeys";

type BreadcrumbLevel = "debug" | "info" | "warning" | "error";

type RecordBreadcrumbInput = {
  readonly category: string;
  readonly data?: Record<string, unknown>;
  readonly level?: BreadcrumbLevel;
  readonly message: string;
};

export function recordBreadcrumb({
  category,
  data,
  level = "info",
  message,
}: RecordBreadcrumbInput): void {
  const causalityKey = getActiveCausalityKey();

  Sentry.addBreadcrumb({
    category,
    data:
      causalityKey === undefined
        ? data
        : { [spanAttributeKeys.causalityKey]: causalityKey, ...data },
    level,
    message,
  });
}
