import { useMemo } from "react";
import { useStableCallback } from "@/shared";
import type { ActionScope, ActionRuntimeDependencyScreen } from "./actionRuntimeDependencies";
import type { RegisteredJsxAction } from "@/services/action-boundary/register";
import { createJsxActions, type RegisteredActionClient, type RegisteredActionTree } from "./createJsxActions";
import { executeRegisteredAction } from "./executeRegisteredAction";
import type { RuntimeDependencyInputs } from "./runtimeDependencyInputs";
import type { ActionEvents } from "./actionExecution";

type UseRegisteredActionsProps = RuntimeDependencyInputs & {
  readonly actionEvents?: ActionEvents;
  readonly screen: ActionRuntimeDependencyScreen;
};

export function useRegisteredActions<TRegistry extends RegisteredActionTree>(
  registry: TRegistry,
  props: UseRegisteredActionsProps,
): RegisteredActionClient<TRegistry> {
  const execute = useStableCallback(
    <TScope extends ActionScope, TActionArgs, TPublicArgs extends unknown[]>(
      action: RegisteredJsxAction<TScope, TActionArgs, TPublicArgs>,
      actionKey: string,
      publicArgs: TPublicArgs,
    ): void => {
      executeRegisteredAction({
        action,
        actionEvents: props.actionEvents,
        actionKey,
        publicArgs,
        runtimeDependencyInputs: props,
        screen: props.screen,
      });
    },
  );

  return useMemo(() => createJsxActions(registry, execute), [execute, registry]);
}



