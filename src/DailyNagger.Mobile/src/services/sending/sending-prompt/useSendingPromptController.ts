import { useRef, useState } from "react";
import type { PendingSendingPrompt } from "@/models";

export function useSendingPromptController() {
  const promptRef = useRef<PendingSendingPrompt | null>(null);
  const [prompt, setPromptState] = useState<PendingSendingPrompt | null>(null);
  const resolveRef = useRef<((didUserAccept: boolean) => void) | null>(null);

  function hasPendingSendingPrompt(): boolean {
    return promptRef.current !== null;
  }

  function getCurrent(): PendingSendingPrompt | null {
    return promptRef.current;
  }

  function askUserForSendingDecision(promptToShow: PendingSendingPrompt): Promise<boolean> {
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

  function set(nextPrompt: PendingSendingPrompt | null): void {
    promptRef.current = nextPrompt;
    setPromptState(nextPrompt);
  }

  return {
    accept,
    askUserForSendingDecision,
    clear,
    getCurrent,
    hasPendingSendingPrompt,
    chooseSecondaryAction,
    state: prompt,
  };
}

export type SendingPromptController = ReturnType<typeof useSendingPromptController>;

