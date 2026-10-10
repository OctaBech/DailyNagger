import {
  runWithMiddleware,
  type MiddlewareExecutionContext,
  type MiddlewareWrapperFunction,
} from "@/middleware";
import { useStableCallback } from "@/shared/useStableCallback";
import type { ActionScope, RuntimeDependencyInputs } from "./action-dependencies";
import { createActionRuntimeDependencies } from "./action-dependencies/actionRuntimeDependencies";
import type { ActionEvents } from "./events";
import type { ActionInvocation } from "./proxyActionsModel";

type UseExecuteActionProps = RuntimeDependencyInputs & {
  readonly actionEvents?: ActionEvents;
  readonly middlewareWrapperFunction?: MiddlewareWrapperFunction<MiddlewareExecutionContext>;
};

export function useExecuteAction(props: UseExecuteActionProps) {
  const environment = props;
  const servicePackages = createActionRuntimeDependencies(props);

  function executeAction<TActionScope extends ActionScope, TActionArgs>(
    actionInvocation: ActionInvocation<TActionScope, TActionArgs>,
  ): void {
    // Look up the current service package for the registered action.
    const serviceDependencies = servicePackages[actionInvocation.action.servicePackageName];

    const executionContexts: MiddlewareExecutionContext[] = [];

    try {
      return runWithMiddleware(
        (context: MiddlewareExecutionContext) => {
          executionContexts.push(context);
          environment.actionEvents?.emit("action-started", context);

          actionInvocation.action.actionFunction(
            actionInvocation.actionArguments,
            serviceDependencies,
          );

          environment.actionEvents?.emit("action-finished", context);
        },
        environment.middlewareWrapperFunction,
        {
          causalityKey: `action/${actionInvocation.actionKey}:${new Date().toISOString()}`,
          metadata: {
            actionKey: actionInvocation.actionKey,
            actionScope: actionInvocation.action.servicePackageName,
          },
        },
      );
    } catch (error) {
      const activeContext = executionContexts[0];

      environment.actionEvents?.emit("action-failed", {
        causalityKey:
          activeContext?.causalityKey ??
          `action/${actionInvocation.actionKey}:failed-before-context`,
        error,
        metadata: activeContext?.metadata ?? {
          actionKey: actionInvocation.actionKey,
          actionScope: actionInvocation.action.servicePackageName,
        },
      });
      throw error;
    }
  }

  return useStableCallback(executeAction);
}
