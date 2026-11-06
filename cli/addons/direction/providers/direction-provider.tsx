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
const DEFAULT_DIRECTION: TextDirection = "__DEFAULT_DIRECTION__";

function readStored(): TextDirection {
  if (typeof window === "undefined") return DEFAULT_DIRECTION;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "ltr" || raw === "rtl" ? raw : DEFAULT_DIRECTION;
}

export function DirectionProvider({ children }: { children: ReactNode }) {
  const [direction, setDirectionState] = useState<TextDirection>(DEFAULT_DIRECTION);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDirectionState(readStored());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dir = direction;
    document.documentElement.lang =
      direction === "rtl" ? document.documentElement.lang || "fa" : document.documentElement.lang;
    window.localStorage.setItem(STORAGE_KEY, direction);
  }, [direction, mounted]);

  const setDirection = useCallback((next: TextDirection) => {
    setDirectionState(next);
  }, []);

  const toggleDirection = useCallback(() => {
    setDirectionState((prev) => (prev === "rtl" ? "ltr" : "rtl"));
  }, []);

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
