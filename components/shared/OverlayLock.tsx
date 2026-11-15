"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type OverlayLockContextValue = {
  locked: boolean;
  acquire: () => void;
  release: () => void;
};

const OverlayLockContext = createContext<OverlayLockContextValue | null>(null);

/** Tracks open overlays so chrome (bottom nav) can yield the screen. */
export function OverlayLockProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const acquire = useCallback(() => {
    setCount((current) => current + 1);
  }, []);

  const release = useCallback(() => {
    setCount((current) => Math.max(0, current - 1));
  }, []);

  const value = useMemo(
    () => ({
      locked: count > 0,
      acquire,
      release,
    }),
    [count, acquire, release],
  );

  return (
    <OverlayLockContext.Provider value={value}>
      {children}
    </OverlayLockContext.Provider>
  );
}

export function useOverlayLocked() {
  return useContext(OverlayLockContext)?.locked ?? false;
}

/** Call with the overlay's open state (or true while a modal is mounted). */
export function useOverlayLock(open: boolean) {
  const context = useContext(OverlayLockContext);

  useEffect(() => {
    if (!open || !context) {
      return;
    }

    context.acquire();
    return () => {
      context.release();
    };
  }, [open, context]);
}
