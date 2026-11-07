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

export type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  systemTheme: "light" | "dark";
  themes: Theme[];
};

type ThemeSnapshot = {
  theme: Theme;
  systemTheme: "light" | "dark";
  resolvedTheme: "light" | "dark";
};

const STORAGE_KEY = "theme";
const THEME_CHANGE = "next-style-guide:theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

const SERVER_SNAPSHOT: ThemeSnapshot = {
  theme: "system",
  systemTheme: "light",
  resolvedTheme: "light",
};

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* ignore */
  }
  return "system";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyDomTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

function getClientSnapshot(): ThemeSnapshot {
  const theme = readStoredTheme();
  const systemTheme = getSystemTheme();
  return {
    theme,
    systemTheme,
    resolvedTheme: theme === "system" ? systemTheme : theme,
  };
}

function subscribe(onStoreChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) onStoreChange();
  }
  function onLocal() {
    onStoreChange();
  }
  function onMediaChange() {
    onStoreChange();
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_CHANGE, onLocal);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onMediaChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_CHANGE, onLocal);
    media.removeEventListener("change", onMediaChange);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    () => SERVER_SNAPSHOT,
  );

  useEffect(() => {
    applyDomTheme(snapshot.resolvedTheme);
  }, [snapshot.resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyDomTheme(resolveTheme(next));
    window.dispatchEvent(new Event(THEME_CHANGE));
  }, []);

  const value = useMemo(
    () => ({
      theme: snapshot.theme,
      setTheme,
      resolvedTheme: snapshot.resolvedTheme,
      systemTheme: snapshot.systemTheme,
      themes: ["light", "dark", "system"] as Theme[],
    }),
    [snapshot, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Fallback when used outside a provider (matches prior next-themes shape). */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "system",
      setTheme: () => {},
      resolvedTheme: "light",
      systemTheme: "light",
      themes: ["light", "dark", "system"],
    };
  }
  return ctx;
}
