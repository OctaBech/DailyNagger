import { runWithMiddleware, type MiddlewareWrapperFunction } from "@/middleware";
import { useStableCallback } from "@/shared/useStableCallback";
import type { ServicePackageName, ServicePackages } from "./action-dependencies";
import type { ActionEvents, ActionExecutionContext } from "./events";
import type { RefObject } from "react";
import type { ActionInvocation } from "./proxyActionsModel";

type UseExecuteActionProps = {
  readonly actionSequenceRef: RefObject<number>;
  readonly actionEvents?: ActionEvents;
  readonly middlewareWrapperFunction?: MiddlewareWrapperFunction<ActionExecutionContext>;
};

export function useExecuteAction(servicePackages: ServicePackages, props: UseExecuteActionProps) {
  const environment = props;
  const { actionSequenceRef } = props;

  function executeAction<TServicePackageName extends ServicePackageName, TActionArgs>(
    actionInvocation: ActionInvocation<TServicePackageName, TActionArgs>,
  ): void {
    // Look up the current service package for the registered action.
    const serviceDependencies = servicePackages[actionInvocation.action.servicePackageName];

    // Count action starts across all screens and menus, not send/completion order.
    const causalityKey = `action:${++actionSequenceRef.current}|name:${actionInvocation.actionKey}|time:${new Date().toISOString()}`;
    const executionContexts: ActionExecutionContext[] = [];
    const args = {
      causalityKey,
      actionArguments: actionInvocation.actionArguments,
      serviceDependencies,
      metadata: {
        actionKey: actionInvocation.actionKey,
        servicePackageName: actionInvocation.action.servicePackageName,
      },
    };

    try {
      return runWithMiddleware(
        (context: typeof args) => {
          executionContexts.push(context);
          environment.actionEvents?.emit("action-started", context);

          actionInvocation.action.actionFunction(
            context.actionArguments,
            context.serviceDependencies,
          );

          environment.actionEvents?.emit("action-finished", context);
        },
        environment.middlewareWrapperFunction,
        args,
      );
    } catch (error) {
      const activeContext = executionContexts[0];

      environment.actionEvents?.emit("action-failed", {
        ...(activeContext ?? args),
        causalityKey: activeContext?.causalityKey ?? causalityKey,
        error,
      });
      throw error;
    }
  }

  return useStableCallback(executeAction);
}
