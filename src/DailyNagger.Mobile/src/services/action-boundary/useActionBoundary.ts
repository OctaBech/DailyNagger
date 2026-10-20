import type { ServicePackages } from "./action-dependencies";
import { useBuildProxyActions } from "./useBuildProxyActions";
import type { ProxyActions, RegisteredActionTree } from "./proxyActionsModel";
import { useExecuteAction } from "./useExecuteAction";
import { useMemo, type RefObject } from "react";
import type { ActionEvents, ActionExecutionContext } from "./events";
import type { MiddlewareWrapperFunction } from "@/middleware";

type UseActionBoundaryProps = {
  readonly actionSequenceRef: RefObject<number>;
  readonly actionEvents?: ActionEvents;
  readonly middlewareWrapperFunction?: MiddlewareWrapperFunction<ActionExecutionContext>;
};

export function useActionBoundary<TRegistry extends RegisteredActionTree>(
  registryName: string,
  registry: TRegistry,
  servicePackages: ServicePackages,
  props: UseActionBoundaryProps,
): {
  readonly proxyActionsForCards: ProxyActions<TRegistry>;
  readonly proxyActionsForDialMenu: ProxyActions<TRegistry>["dial"];
} {
  const stableExecuteAction = useExecuteAction(servicePackages, props);

  const proxyActions = useBuildProxyActions(registry, stableExecuteAction, registryName);

  return useMemo(
    () => ({
      proxyActionsForCards: proxyActions,
      proxyActionsForDialMenu: proxyActions.dial as ProxyActions<TRegistry>["dial"],
    }),
    [proxyActions],
  );
}
