import { useMemo } from "react";
import type { ExecuteAction, ProxyActions, RegisteredActionTree } from "./proxyActionsModel";

export function useBuildProxyActions<TRegistry extends RegisteredActionTree>(
  registry: TRegistry,
  executeAction: ExecuteAction,
  registryName: string,
): ProxyActions<TRegistry> {
  return useMemo(
    () => buildProxyActions(registry, executeAction, registryName),
    [executeAction, registry, registryName],
  );
}

function buildProxyActions<TRegistry extends RegisteredActionTree>(
  registry: TRegistry,
  executeAction: ExecuteAction,
  registryName: string,
): ProxyActions<TRegistry> {
  const proxyActions: Record<string, Record<string, (actionArguments: unknown) => void>> = {};

  // Walk the registry groups and preserve their structure in the function pack.
  Object.entries(registry).forEach(([groupName, group]) => {
    proxyActions[groupName] = {};

    // Create one proxy function for each action registration.
    Object.entries(group).forEach(([actionName, action]) => {
      // Build a descriptive key for action events and observability.
      const actionKey = `${registryName}/${groupName}/${actionName}`;

      // The closure retains this registration; it runs only when frontstage calls it.
      proxyActions[groupName][actionName] = (actionArguments: unknown) => {
        // Forward the registration and caller arguments to the shared executor.
        executeAction({ action, actionKey, actionArguments });
      };
    });
  });

  return proxyActions as ProxyActions<TRegistry>;
}
