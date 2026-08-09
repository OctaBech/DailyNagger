import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type ModalKeyboardBoundaryOwner =
  | "nagger-schedule-modal"
  | "nagger-target-time-modal"
  | "tagging-modal"
  | "task-entry-value-type-modal"
  | "task-step-name-modal";

type ModalKeyboardBoundaryContextValue = {
  readonly isModalKeyboardBoundaryActive: boolean;
  readonly activeModalKeyboardBoundaryOwners: readonly ModalKeyboardBoundaryOwner[];
  readonly beginModalKeyboardBoundary: (owner: ModalKeyboardBoundaryOwner) => void;
  readonly endModalKeyboardBoundary: (owner: ModalKeyboardBoundaryOwner) => void;
};

const ModalKeyboardBoundaryContext = createContext<ModalKeyboardBoundaryContextValue | null>(null);

type ModalKeyboardBoundaryProviderProps = {
  readonly children: ReactNode;
};

export function ModalKeyboardBoundaryProvider({ children }: ModalKeyboardBoundaryProviderProps) {
  const [activeOwners, setActiveOwners] = useState<readonly ModalKeyboardBoundaryOwner[]>([]);

  const beginModalKeyboardBoundary = useCallback((owner: ModalKeyboardBoundaryOwner) => {
    setActiveOwners((currentOwners) => {
      if (currentOwners.includes(owner)) {
        throw new Error(`Modal keyboard boundary owner is already active: ${owner}.`);
      }

      return [...currentOwners, owner];
    });
  }, []);

  const endModalKeyboardBoundary = useCallback((owner: ModalKeyboardBoundaryOwner) => {
    setActiveOwners((currentOwners) =>
      currentOwners.filter((currentOwner) => currentOwner !== owner),
    );
  }, []);

  const value = useMemo(
    () => ({
      activeModalKeyboardBoundaryOwners: activeOwners,
      beginModalKeyboardBoundary,
      endModalKeyboardBoundary,
      isModalKeyboardBoundaryActive: activeOwners.length > 0,
    }),
    [activeOwners, beginModalKeyboardBoundary, endModalKeyboardBoundary],
  );

  return (
    <ModalKeyboardBoundaryContext.Provider value={value}>
      {children}
    </ModalKeyboardBoundaryContext.Provider>
  );
}

export function useModalKeyboardBoundary() {
  const context = useContext(ModalKeyboardBoundaryContext);
  if (context === null) {
    throw new Error("useModalKeyboardBoundary must be used inside AppShell.");
  }

  return context;
}
