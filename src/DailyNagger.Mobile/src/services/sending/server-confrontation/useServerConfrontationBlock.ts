import { useRef, useState } from "react";
import type { ServerConfrontationPrompt } from "../contracts";

export function useServerConfrontationBlock() {
  const promptRef = useRef<ServerConfrontationPrompt | null>(null);
  const [prompt, setPromptState] = useState<ServerConfrontationPrompt | null>(null);
  const resolveRef = useRef<((didUserAccept: boolean) => void) | null>(null);

  function hasActiveConfrontation(): boolean {
    return promptRef.current !== null;
  }

  function getCurrent(): ServerConfrontationPrompt | null {
    return promptRef.current;
  }

  function askUserForPermission(promptToShow: ServerConfrontationPrompt): Promise<boolean> {
    set(promptToShow);

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }

  function accept(): void {
    answer(true);
  }

  function chooseSecondaryAction(): void {
    answer(false);
  }

  function clear(): void {
    set(null);
  }

  function answer(didUserAccept: boolean): void {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    set(null);
    resolve?.(didUserAccept);
  }

  function set(nextPrompt: ServerConfrontationPrompt | null): void {
    promptRef.current = nextPrompt;
    setPromptState(nextPrompt);
  }

  return {
    accept,
    askUserForPermission,
    clear,
    getCurrent,
    hasActiveConfrontation,
    chooseSecondaryAction,
    state: prompt,
  };
}

export type ServerConfrontationBlock = ReturnType<typeof useServerConfrontationBlock>;
