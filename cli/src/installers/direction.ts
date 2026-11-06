import fs from "fs-extra";
import path from "node:path";

import type { DirectionOption, ScaffoldOptions } from "../types.js";
import type { Installer } from "./types.js";

function fixedHook(direction: "ltr" | "rtl"): string {
  const isRtl = direction === "rtl";
  return `export type TextDirection = "ltr" | "rtl";

export type DirectionValue = {
  direction: TextDirection;
  isRtl: boolean;
  canToggle: false;
  setDirection: (next: TextDirection) => void;
  toggleDirection: () => void;
};

const noop = (_next?: TextDirection) => {
  /* fixed direction — enable \`direction=both\` to toggle at runtime */
};

/** Stable fixed direction for this scaffold (\`${direction}\`). */
const FIXED: DirectionValue = {
  direction: "${direction}",
  isRtl: ${isRtl},
  canToggle: false,
  setDirection: noop,
  toggleDirection: noop,
};

export function useDirection(): DirectionValue {
  return FIXED;
}
`;
}

function bothProvider(defaultDirection: "ltr" | "rtl"): string {
  return `"use client";

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
const DEFAULT_DIRECTION: TextDirection = "${defaultDirection}";

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
`;
}

function bothHookReexport(): string {
  return `export {
  DirectionProvider,
  useDirection,
  type TextDirection,
} from "@/providers/direction-provider";
`;
}

function directionToggleSource(styling: ScaffoldOptions["styling"]): string {
  if (styling === "mui") {
    return `"use client";

import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useDirection } from "@/hooks/use-direction";

/** Sample control — swap for your chrome; shows runtime LTR/RTL when direction=both. */
export function DirectionToggle() {
  const { direction, setDirection, toggleDirection } = useDirection();

  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      <Typography variant="subtitle2">Text direction (sample)</Typography>
      <ButtonGroup size="small" variant="outlined">
        <Button
          variant={direction === "ltr" ? "contained" : "outlined"}
          onClick={() => setDirection("ltr")}
        >
          LTR
        </Button>
        <Button
          variant={direction === "rtl" ? "contained" : "outlined"}
          onClick={() => setDirection("rtl")}
        >
          RTL
        </Button>
        <Button onClick={toggleDirection}>Toggle</Button>
      </ButtonGroup>
    </Stack>
  );
}
`;
  }

  return `"use client";

import { useDirection } from "@/hooks/use-direction";

/** Sample control — swap for your chrome; shows runtime LTR/RTL when direction=both. */
export function DirectionToggle() {
  const { direction, setDirection, toggleDirection } = useDirection();

  return (
    <div className="direction-toggle" style={{ marginTop: "1rem" }}>
      <p className="meta" style={{ marginBottom: "0.5rem" }}>
        Text direction (sample): <strong>{direction.toUpperCase()}</strong>
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => setDirection("ltr")}>
          LTR
        </button>
        <button type="button" onClick={() => setDirection("rtl")}>
          RTL
        </button>
        <button type="button" onClick={toggleDirection}>
          Toggle
        </button>
      </div>
    </div>
  );
}
`;
}

const RULE = `---
description: Text direction (LTR / RTL)
globs: src/providers/direction-provider.tsx,src/hooks/use-direction.ts,src/components/direction-toggle/**
alwaysApply: false
---

# Direction

- Hook: \`useDirection()\` from \`@/hooks/use-direction\`.
- \`direction=both\` → \`DirectionProvider\` + optional \`DirectionToggle\` sample.
- MUI: Emotion cache uses \`stylis-plugin-rtl\` when \`isRtl\`; theme \`direction\` follows the hook.
- Prefer logical CSS (\`margin-inline\`, \`padding-inline\`) over raw left/right when supporting both.
`;

function defaultForBoth(options: ScaffoldOptions): "ltr" | "rtl" {
  // MUI apps often start RTL; otherwise LTR.
  return options.styling === "mui" ? "rtl" : "ltr";
}

export function needsRtlEmotion(options: ScaffoldOptions): boolean {
  return (
    options.styling === "mui" &&
    (options.direction === "rtl" || options.direction === "both")
  );
}

export const directionInstaller: Installer = {
  id: "direction",
  active: () => true,
  async run({ projectDir, options }) {
    const hooksDir = path.join(projectDir, "src", "hooks");
    const providersDir = path.join(projectDir, "src", "providers");
    await fs.ensureDir(hooksDir);
    await fs.ensureDir(providersDir);
    await fs.remove(path.join(hooksDir, ".gitkeep"));

    const mode: DirectionOption = options.direction;

    if (mode === "both") {
      const initial = defaultForBoth(options);
      await fs.writeFile(
        path.join(providersDir, "direction-provider.tsx"),
        bothProvider(initial),
        "utf8",
      );
      await fs.writeFile(
        path.join(hooksDir, "use-direction.ts"),
        bothHookReexport(),
        "utf8",
      );
      const toggleDir = path.join(
        projectDir,
        "src",
        "components",
        "direction-toggle",
      );
      await fs.ensureDir(toggleDir);
      await fs.writeFile(
        path.join(toggleDir, "index.tsx"),
        directionToggleSource(options.styling),
        "utf8",
      );
    } else {
      await fs.writeFile(
        path.join(hooksDir, "use-direction.ts"),
        fixedHook(mode),
        "utf8",
      );
      await fs.remove(path.join(providersDir, "direction-provider.tsx"));
      await fs.remove(
        path.join(projectDir, "src", "components", "direction-toggle"),
      );
    }

    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "direction.mdc"),
      RULE,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "ui", "direction.md"),
      `# Direction

Mode: **${mode}**

- Hook: \`useDirection()\` → \`@/hooks/use-direction\`
${mode === "both" ? "- Provider: `DirectionProvider` (persists to `localStorage`)\n- Sample: `DirectionToggle` on the home page\n" : `- Fixed \`dir="${mode}"\` on \`<html>\`\n`}
${needsRtlEmotion(options) ? "- MUI Emotion RTL via `stylis-plugin-rtl` when `isRtl`\n" : ""}
`,
    );
  },
};
