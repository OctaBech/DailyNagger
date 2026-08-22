import { useRef } from "react";

type TimerDelay =
  | {
      readonly kind: "fixed";
      readonly ms: number;
    }
  | {
      readonly kind: "backoff";
      readonly initialMs: number;
      readonly multiplier: number;
      readonly maxMs: number;
    };

export function useTimer<TDelayName extends string>(delays: Record<TDelayName, TimerDelay>) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffMsRef = useRef<number>(0);
  const isDisabledRef = useRef(false);

  function set(delayName: TDelayName, callback: () => Promise<boolean>): void {
    if (isDisabledRef.current) return;

    stop();

    const delay = delays[delayName];

    timerRef.current = setTimeout(() => {
      void callback();
    }, getDelayMs(delay));
  }

  function stop(): void {
    if (timerRef.current === null) return;

    clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function disable(): void {
    isDisabledRef.current = true;
    stop();
  }

  function enable(): void {
    isDisabledRef.current = false;
  }

  function resetBackoff(): void {
    backoffMsRef.current = 0;
  }

  function getDelayMs(delay: TimerDelay): number {
    switch (delay.kind) {
      case "fixed":
        return delay.ms;
      case "backoff":
        return increaseBackoffDelay(delay);
    }
  }

  function increaseBackoffDelay(delay: Extract<TimerDelay, { readonly kind: "backoff" }>): number {
    if (backoffMsRef.current < delay.initialMs) {
      backoffMsRef.current = delay.initialMs;
      return backoffMsRef.current;
    }

    backoffMsRef.current = Math.min(backoffMsRef.current * delay.multiplier, delay.maxMs);
    return backoffMsRef.current;
  }

  return {
    disable,
    enable,
    resetBackoff,
    set,
    stop,
  };
}
