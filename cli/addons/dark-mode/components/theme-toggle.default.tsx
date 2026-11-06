"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/providers/theme-provider";

/** Sample control — swap for your chrome; light / dark / system when darkMode is on. */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="sample-toggle" aria-hidden>
        <p className="sample-toggle__label">Theme</p>
        <div className="sample-toggle__row">
          <button type="button" disabled>
            …
          </button>
        </div>
      </div>
    );
  }

  const active = theme ?? "system";

  return (
    <div className="sample-toggle">
      <p className="sample-toggle__label">
        Theme (sample):{" "}
        <strong>{active}</strong>
        {active === "system" ? ` → ${resolvedTheme}` : ""}
      </p>
      <div className="sample-toggle__row">
        <button
          type="button"
          className={active === "light" ? "is-active" : undefined}
          onClick={() => setTheme("light")}
        >
          Light
        </button>
        <button
          type="button"
          className={active === "dark" ? "is-active" : undefined}
          onClick={() => setTheme("dark")}
        >
          Dark
        </button>
        <button
          type="button"
          className={active === "system" ? "is-active" : undefined}
          onClick={() => setTheme("system")}
        >
          System
        </button>
      </div>
    </div>
  );
}
