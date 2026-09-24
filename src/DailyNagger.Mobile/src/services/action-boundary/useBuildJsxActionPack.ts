import { useMemo } from "react";
import type { ExecuteJsxAction, JsxActionPack, RegisteredActionTree } from "./jsxActionPackModel";

export function useBuildJsxActionPack<TRegistry extends RegisteredActionTree>(
  registry: TRegistry,
  executeJsxAction: ExecuteJsxAction,
): JsxActionPack<TRegistry> {
  return useMemo(
    () => buildJsxActionPack(registry, executeJsxAction),
    [executeJsxAction, registry],
  );
}

function buildJsxActionPack<TRegistry extends RegisteredActionTree>(
  registry: TRegistry,
  executeJsxAction: ExecuteJsxAction,
): JsxActionPack<TRegistry> {
  const jsxActionPack: Record<string, Record<string, (...args: unknown[]) => void>> = {};

  Object.entries(registry).forEach(([groupName, group]) => {
    jsxActionPack[groupName] = {};

    Object.entries(group).forEach(([actionName, action]) => {
      const actionKey = `${groupName}/${actionName}`;

      jsxActionPack[groupName][actionName] = (...publicArgs: unknown[]) => {
        executeJsxAction({ action, actionKey, publicArgs });
      };
    });
  });

  return jsxActionPack as JsxActionPack<TRegistry>;
}
