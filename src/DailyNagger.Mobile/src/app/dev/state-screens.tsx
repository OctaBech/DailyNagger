import { Primitives } from "@/components";
import { useLocalSearchParams } from "expo-router";

type StateScreenPreviewKey =
  | "loading"
  | "preparing"
  | "replaying-saved-updates"
  | "server-unavailable"
  | "server-error"
  | "version-conflict"
  | "saved-startup-update-rejected"
  | "saved-updates-blocked"
  | "render-error";

type StateScreenPreviewProps = Parameters<typeof Primitives.StateScreen>[0];

const previews: Record<StateScreenPreviewKey, StateScreenPreviewProps> = {
  loading: {
    title: "Loading today's plan",
    message: "DailyNagger is fetching today's plan.",
    showSpinner: true,
  },
  preparing: {
    title: "Building new plan",
    message: "DailyNagger is building your new plan. It will try again in 5 minutes.",
    showSpinner: true,
    primaryAction: {
      label: "Try now",
      accessibilityLabel: "Try loading the daily nagger plan now",
      onPress: noop,
    },
  },
  "replaying-saved-updates": {
    title: "Sending saved updates",
    message:
      "DailyNagger is sending 3 saved updates before loading today's plan. If the server is preparing a new plan, this can take up to 15 minutes.",
    showSpinner: true,
  },
  "server-unavailable": {
    title: "Server unavailable",
    message:
      "DailyNagger could not connect to the server. Check that the backend is running and try again.",
    detail: "Failed to fetch",
    primaryAction: {
      label: "Reload",
      accessibilityLabel: "Reload daily nagger plan",
      onPress: noop,
    },
  },
  "server-error": {
    title: "Server error",
    message: "DailyNagger reached the server, but the plan could not be loaded.",
    detail: "Failed to fetch todays nagger plan. Status: 500",
    primaryAction: {
      label: "Reload",
      accessibilityLabel: "Reload daily nagger plan",
      onPress: noop,
    },
  },
  "version-conflict": {
    title: "Version conflict",
    message:
      "The server has a newer version. DailyNagger can force this batch through or discard it.",
    detail: "Failed to send update. Status: 409. Current version: 12.",
    primaryAction: {
      label: "Force update",
      accessibilityLabel: "Force update from server version",
      onPress: noop,
    },
    secondaryAction: {
      label: "Discard batch",
      accessibilityLabel: "Discard saved batch",
      kind: "secondary",
      onPress: noop,
    },
  },
  "saved-startup-update-rejected": {
    title: "Saved update cannot be sent",
    message: "DailyNagger can discard this saved batch and continue loading today's plan.",
    detail: "Failed to send update. Status: 400. Payload version is outside the request span.",
    primaryAction: {
      label: "Discard saved batch",
      accessibilityLabel: "Discard saved batch",
      onPress: noop,
    },
  },
  "saved-updates-blocked": {
    title: "Saved updates blocked",
    message:
      "DailyNagger could not send the saved updates. Try again, or discard them before loading today's plan.",
    detail: "Failed to send update. Status: 409",
    primaryAction: {
      label: "Try again",
      accessibilityLabel: "Try sending saved updates again",
      onPress: noop,
    },
    secondaryAction: {
      label: "Discard saved updates",
      accessibilityLabel: "Discard saved updates and reload daily nagger plan",
      kind: "secondary",
      onPress: noop,
    },
  },
  "render-error": {
    title: "Something broke",
    message:
      "DailyNagger hit an unexpected screen error. You can retry the current view or go back to the plan.",
    detail: "Cannot read properties of null.",
    primaryAction: {
      label: "Try again",
      accessibilityLabel: "Try rendering the current screen again",
      onPress: noop,
    },
    secondaryAction: {
      label: "Go home",
      accessibilityLabel: "Go back to the daily nagger plan",
      kind: "secondary",
      onPress: noop,
    },
  },
};

export default function StateScreensPreviewRoute() {
  const params = useLocalSearchParams<{
    readonly state?: string;
    readonly title?: string;
    readonly message?: string;
    readonly detail?: string;
    readonly warning?: string;
    readonly primaryLabel?: string;
    readonly secondaryLabel?: string;
    readonly spinner?: string;
  }>();
  const previewKey = getPreviewKey(readParam(params.state));
  const preview = applyParamOverrides(previews[previewKey], params);

  return (
    <Primitives.StateScreen
      warning={
        readParam(params.warning) ??
        "Dev preview route. Use /dev/state-screens?state=server-error&message=Hello to inspect another state."
      }
      {...preview}
    />
  );
}

function getPreviewKey(state: string | undefined): StateScreenPreviewKey {
  if (state === undefined) return "loading";
  if (state in previews) return state as StateScreenPreviewKey;

  return "loading";
}

function applyParamOverrides(
  preview: StateScreenPreviewProps,
  params: {
    readonly title?: string | string[];
    readonly message?: string | string[];
    readonly detail?: string | string[];
    readonly primaryLabel?: string | string[];
    readonly secondaryLabel?: string | string[];
    readonly spinner?: string | string[];
  },
): StateScreenPreviewProps {
  const title = readParam(params.title);
  const message = readParam(params.message);
  const detail = readParam(params.detail);
  const primaryLabel = readParam(params.primaryLabel);
  const secondaryLabel = readParam(params.secondaryLabel);
  const spinner = readParam(params.spinner);

  return {
    ...preview,
    ...(title !== undefined ? { title } : {}),
    ...(message !== undefined ? { message } : {}),
    ...(detail !== undefined ? { detail } : {}),
    ...(spinner !== undefined ? { showSpinner: spinner === "true" } : {}),
    ...(primaryLabel !== undefined && preview.primaryAction !== undefined
      ? {
          primaryAction: {
            ...preview.primaryAction,
            label: primaryLabel,
            accessibilityLabel: primaryLabel,
          },
        }
      : {}),
    ...(secondaryLabel !== undefined && preview.secondaryAction !== undefined
      ? {
          secondaryAction: {
            ...preview.secondaryAction,
            label: secondaryLabel,
            accessibilityLabel: secondaryLabel,
          },
        }
      : {}),
  };
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function noop(): void {}
