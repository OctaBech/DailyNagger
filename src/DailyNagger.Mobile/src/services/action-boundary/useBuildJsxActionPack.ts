import { useMemo } from "react";
import type { ActionScope } from "./action-dependencies";
import type { RegisteredJsxAction } from "@/services/action-boundary/register";

export type RegisteredActionTree = {
  readonly [group: string]: {
    readonly [name: string]: AnyRegisteredAction;
  };
};

type AnyRegisteredAction = {
  readonly scope: ActionScope;
  readonly toActionArgs: (...publicArgs: any[]) => any;
  readonly run: (args: any, runtimeDependencies: any) => void;
};

export type JsxActionPack<TRegistry extends RegisteredActionTree> = {
  readonly [TGroup in keyof TRegistry]: {
    readonly [TName in keyof TRegistry[TGroup]]: TRegistry[TGroup][TName] extends {
      readonly toActionArgs: (...publicArgs: infer TPublicArgs) => unknown;
    }
      ? (...args: TPublicArgs) => void
      : never;
  };
};

export type JsxAction<
  TScope extends ActionScope = ActionScope,
  TActionArgs = unknown,
  TPublicArgs extends unknown[] = unknown[],
> = {
  readonly action: RegisteredJsxAction<TScope, TActionArgs, TPublicArgs>;
  readonly actionKey: string;
  readonly publicArgs: TPublicArgs;
};

type ExecuteJsxAction = <TScope extends ActionScope, TActionArgs, TPublicArgs extends unknown[]>(
  jsxAction: JsxAction<TScope, TActionArgs, TPublicArgs>,
) => void;

export function useBuildJsxActionPack<TRegistry extends RegisteredActionTree>(
  registry: TRegistry,
  executeJsxAction: ExecuteJsxAction,
): JsxActionPack<TRegistry> {
  return useMemo(() => buildJsxActionPack(registry, executeJsxAction), [executeJsxAction, registry]);
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
