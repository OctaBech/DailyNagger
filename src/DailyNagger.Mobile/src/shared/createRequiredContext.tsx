import { createContext, useContext, type ReactNode } from "react";

type RequiredContextProviderProps<TValue> = {
  readonly value: TValue;
  readonly children: ReactNode;
};

export function createRequiredContext<TValue>(name: string) {
  const Context = createContext<TValue | null>(null);

  function Provider({ value, children }: RequiredContextProviderProps<TValue>) {
    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useRequiredContext(): TValue {
    const value = useContext(Context);

    if (value === null) {
      throw new Error(`${name} is missing.`);
    }

    return value;
  }

  return { Provider, useRequiredContext } as const;
}
