import { useCallback, useMemo, useRef } from "react";

export function useLock() {
  const isLockedRef = useRef(false);

  const tryLock = useCallback((): boolean => {
    if (isLockedRef.current) return false;

    isLockedRef.current = true;
    return true;
  }, []);

  const lock = useCallback((): void => {
    isLockedRef.current = true;
  }, []);

  const isLocked = useCallback((): boolean => {
    return isLockedRef.current;
  }, []);

  const releaseLock = useCallback((): void => {
    isLockedRef.current = false;
  }, []);

  return useMemo(
    () => ({
      tryLock,
      lock,
      isLocked,
      releaseLock,
    }),
    [tryLock, lock, isLocked, releaseLock],
  );
}
