import { createContext, useContext, useState, type ReactNode } from "react";
import type { ScreenPositionHandoff } from "./contracts";
import { createScreenPositionHandoff } from "./createScreenPositionHandoff";

const ScreenPositionHandoffContext = createContext<ScreenPositionHandoff | null>(null);

type ScreenPositionHandoffProviderProps = {
  readonly children: ReactNode;
};

export function ScreenPositionHandoffProvider({ children }: ScreenPositionHandoffProviderProps) {
  const [handoff] = useState(createScreenPositionHandoff);

  return (
    <ScreenPositionHandoffContext.Provider value={handoff}>
      {children}
    </ScreenPositionHandoffContext.Provider>
  );
}

export function useScreenPositionHandoff(): ScreenPositionHandoff {
  const handoff = useContext(ScreenPositionHandoffContext);

  if (handoff === null) {
    throw new Error("ScreenPositionHandoffContext is missing.");
  }

  return handoff;
}
