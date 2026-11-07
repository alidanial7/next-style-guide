"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export type TextDirection = "ltr" | "rtl";

type DirectionContextValue = {
  direction: TextDirection;
  isRtl: boolean;
  canToggle: true;
  setDirection: (next: TextDirection) => void;
  toggleDirection: () => void;
};

const DirectionContext = createContext<DirectionContextValue | null>(null);

const STORAGE_KEY = "app-direction";
const DIRECTION_CHANGE = "next-style-guide:direction";
const DEFAULT_DIRECTION: TextDirection = "__DEFAULT_DIRECTION__";

function readStored(): TextDirection {
  if (typeof window === "undefined") return DEFAULT_DIRECTION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "ltr" || raw === "rtl") return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_DIRECTION;
}

function applyDomDirection(direction: TextDirection) {
  document.documentElement.dir = direction;
  if (direction === "rtl") {
    document.documentElement.lang =
      document.documentElement.lang || "fa";
  }
}

function subscribe(onStoreChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) onStoreChange();
  }
  function onLocal() {
    onStoreChange();
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener(DIRECTION_CHANGE, onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(DIRECTION_CHANGE, onLocal);
  };
}

export function DirectionProvider({ children }: { children: ReactNode }) {
  const direction = useSyncExternalStore(
    subscribe,
    readStored,
    () => DEFAULT_DIRECTION,
  );

  useEffect(() => {
    applyDomDirection(direction);
  }, [direction]);

  const setDirection = useCallback((next: TextDirection) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyDomDirection(next);
    window.dispatchEvent(new Event(DIRECTION_CHANGE));
  }, []);

  const toggleDirection = useCallback(() => {
    setDirection(direction === "rtl" ? "ltr" : "rtl");
  }, [direction, setDirection]);

  const value = useMemo<DirectionContextValue>(
    () => ({
      direction,
      isRtl: direction === "rtl",
      canToggle: true,
      setDirection,
      toggleDirection,
    }),
    [direction, setDirection, toggleDirection],
  );

  return (
    <DirectionContext.Provider value={value}>{children}</DirectionContext.Provider>
  );
}

export function useDirection(): DirectionContextValue {
  const ctx = useContext(DirectionContext);
  if (!ctx) {
    throw new Error("useDirection must be used within DirectionProvider");
  }
  return ctx;
}
