import type { ActionRuntimeDependencyScreen } from "./action-dependencies";
import type { RuntimeDependencyInputs } from "./action-dependencies";
import { useBuildJsxActionPack, type JsxActionPack, type RegisteredActionTree } from "./useBuildJsxActionPack";
import { useExecuteJsxAction } from "./useExecuteJsxAction";
import type { ActionEvents, ActionExecutionWrapper } from "./events";

type UseActionBoundaryProps = RuntimeDependencyInputs & {
  readonly actionEvents?: ActionEvents;
  readonly actionExecutionWrapper?: ActionExecutionWrapper;
  readonly screen: ActionRuntimeDependencyScreen;
};

export function useActionBoundary<TRegistry extends RegisteredActionTree>(
  registry: TRegistry,
  props: UseActionBoundaryProps,
): JsxActionPack<TRegistry> {
  const executeJsxAction = useExecuteJsxAction(props);

  return useBuildJsxActionPack(registry, executeJsxAction);
}
