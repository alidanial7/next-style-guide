import type { ScaffoldOptions } from "./types.js";

export type PresetId =
  | "custom"
  | "minimal"
  | "api-app"
  | "marketing"
  | "dashboard";

type OptionSeed = Omit<ScaffoldOptions, "name" | "slug" | "noInstall">;

export const PRESET_SEEDS: Record<Exclude<PresetId, "custom">, OptionSeed> = {
  minimal: {
    packageManager: "pnpm",
    auth: "none",
    styling: "none",
    ui: "none",
    shadcnSet: "minimal",
    data: "rsc",
    store: "none",
    icons: "none",
    validation: "zod",
    i18n: false,
    darkMode: false,
    apiEnvelope: false,
    endpoints: false,
    seo: false,
    eslint: false,
    prettier: false,
    husky: false,
    deploy: "none",
    ci: false,
    testing: false,
    playwright: false,
  },
  "api-app": {
    packageManager: "pnpm",
    auth: "jwt",
    styling: "tailwind",
    ui: "shadcn",
    shadcnSet: "starter",
    data: "tanstack-query",
    store: "zustand",
    icons: "lucide",
    validation: "zod",
    i18n: false,
    darkMode: true,
    apiEnvelope: true,
    endpoints: true,
    seo: false,
    eslint: true,
    prettier: true,
    husky: true,
    deploy: "none",
    ci: true,
    testing: true,
    playwright: false,
  },
  marketing: {
    packageManager: "pnpm",
    auth: "none",
    styling: "tailwind",
    ui: "shadcn",
    shadcnSet: "minimal",
    data: "rsc",
    store: "none",
    icons: "lucide",
    validation: "zod",
    i18n: true,
    darkMode: true,
    apiEnvelope: false,
    endpoints: false,
    seo: true,
    eslint: true,
    prettier: true,
    husky: true,
    deploy: "vercel",
    ci: true,
    testing: true,
    playwright: false,
  },
  dashboard: {
    packageManager: "pnpm",
    auth: "none",
    styling: "tailwind",
    ui: "shadcn",
    shadcnSet: "starter",
    data: "tanstack-query",
    store: "zustand",
    icons: "lucide",
    validation: "zod",
    i18n: false,
    darkMode: true,
    apiEnvelope: false,
    endpoints: false,
    seo: false,
    eslint: true,
    prettier: true,
    husky: true,
    deploy: "none",
    ci: true,
    testing: true,
    playwright: false,
  },
};

export function describePreset(id: Exclude<PresetId, "custom">): string {
  const seed = PRESET_SEEDS[id];
  return [
    `styling=${seed.styling}`,
    seed.ui === "shadcn" ? `shadcn:${seed.shadcnSet}` : null,
    `auth=${seed.auth}`,
    seed.store !== "none" ? `store=${seed.store}` : null,
    `validation=${seed.validation}`,
    seed.endpoints ? "endpoints" : null,
    seed.data === "tanstack-query" ? "query" : null,
    seed.darkMode ? "dark" : null,
    seed.deploy !== "none" ? `deploy=${seed.deploy}` : null,
    seed.seo ? "seo" : null,
    seed.i18n ? "i18n" : null,
    seed.testing ? "vitest" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

type WarningOpts = {
  /** Include advisory tips (Query vs store, etc.). Default: false. */
  verbose?: boolean;
};

/** Soft warnings for odd but allowed combinations. */
export function collectOptionWarnings(
  options: ScaffoldOptions,
  { verbose = false }: WarningOpts = {},
): string[] {
  const warnings: string[] = [];

  if (options.auth === "jwt" && !options.endpoints) {
    warnings.push(
      "JWT without endpoints: only token-storage is added (no axios refresh wiring).",
    );
  }
  if (options.ui === "shadcn" && options.styling !== "tailwind") {
    warnings.push("shadcn requires Tailwind — ui forced to none.");
  }
  if (options.darkMode && options.styling !== "tailwind") {
    warnings.push("Dark mode requires Tailwind — disabled.");
  }
  if (options.apiEnvelope && !options.endpoints) {
    warnings.push(
      "API envelope enabled without endpoints: unwrap applies to src/lib/http.ts apiFetch.",
    );
  }
  if (options.playwright && !options.testing) {
    warnings.push("Playwright was requested without Vitest — enabling testing.");
  }
  if (
    verbose &&
    options.store !== "none" &&
    options.data === "tanstack-query"
  ) {
    warnings.push(
      "Tip: Query = server cache; store = UI/session only. See docs/style-guide/overview/architecture.md",
    );
  }

  return warnings;
}
