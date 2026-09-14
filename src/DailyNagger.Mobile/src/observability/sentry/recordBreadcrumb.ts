import * as Sentry from "@sentry/react-native";

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
  Sentry.addBreadcrumb({
    category,
    data,
    level,
    message,
  });
}
