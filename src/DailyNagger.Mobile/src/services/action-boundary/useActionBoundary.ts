import type { RuntimeDependencyInputs } from "./action-dependencies";
import { useBuildProxyActions } from "./useBuildProxyActions";
import type { ProxyActions, RegisteredActionTree } from "./proxyActionsModel";
import { useExecuteAction } from "./useExecuteAction";
import type { ActionEvents } from "./events";
import type { MiddlewareExecutionContext, MiddlewareWrapperFunction } from "@/middleware";

type UseActionBoundaryProps = RuntimeDependencyInputs & {
  readonly actionEvents?: ActionEvents;
  readonly middlewareWrapperFunction?: MiddlewareWrapperFunction<MiddlewareExecutionContext>;
};

export function useActionBoundary<TRegistry extends RegisteredActionTree>(
  registry: TRegistry,
  props: UseActionBoundaryProps,
): ProxyActions<TRegistry> {
  const stableExecuteAction = useExecuteAction(props);

  return useBuildProxyActions(registry, stableExecuteAction);
}
