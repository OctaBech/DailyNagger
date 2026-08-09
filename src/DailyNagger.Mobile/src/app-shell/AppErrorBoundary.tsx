import { Component, type ErrorInfo, type ReactNode } from "react";
import { Primitives } from "@/components";
import { router } from "expo-router";

type AppErrorBoundaryProps = {
  readonly children: ReactNode;
};

type AppErrorBoundaryState = {
  readonly error: Error | null;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("AppErrorBoundary caught render error", error, errorInfo);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  private goHome = (): void => {
    this.reset();
    router.replace("/");
  };

  render() {
    const { error } = this.state;

    if (error === null) return this.props.children;

    return (
      <Primitives.StateScreen
        title="Something broke"
        message="DailyNagger hit an unexpected screen error. You can retry the current view or go back to the plan."
        detail={error.message}
        primaryAction={{
          label: "Try again",
          accessibilityLabel: "Try rendering the current screen again",
          onPress: this.reset,
        }}
        secondaryAction={{
          label: "Go home",
          accessibilityLabel: "Go back to the daily nagger plan",
          kind: "secondary",
          onPress: this.goHome,
        }}
      />
    );
  }
}
