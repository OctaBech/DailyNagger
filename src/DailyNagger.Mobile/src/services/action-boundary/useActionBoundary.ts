import type { ActionRuntimeDependencyScreen, RuntimeDependencyInputs } from "./action-dependencies";
import { useBuildJsxActionPack } from "./useBuildJsxActionPack";
import type { JsxActionPack, RegisteredActionTree } from "./jsxActionPackModel";
import { useExecuteJsxAction } from "./useExecuteJsxAction";
import type { ActionEvents } from "./events";
import type { ActionExecutionWrapper } from "./middleware";

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


