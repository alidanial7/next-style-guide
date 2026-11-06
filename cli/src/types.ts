/**
 * Scaffold options.
 * Base ships with safe defaults; installers flip features on.
 */
export type AuthOption = "none" | "jwt" | "authjs";
/** CSS / component system foundation */
export type StylingOption = "none" | "tailwind" | "mui";
/** shadcn only valid when styling === "tailwind" */
export type UiOption = "none" | "shadcn";
/** How many shadcn primitives to ship (only when ui === "shadcn") */
export type ShadcnSetOption = "minimal" | "starter";
export type DataOption = "rsc" | "tanstack-query";
export type IconOption = "none" | "lucide" | "tabler";
export type ValidationOption = "zod" | "yup";
/** Client global state — opt-in */
export type StoreOption = "none" | "zustand" | "redux";
export type PackageManager = "pnpm" | "npm" | "yarn";
/** Production deploy target */
export type DeployOption = "none" | "vercel" | "docker";

export type ScaffoldOptions = {
  /** Display name (UI / tokens). When scaffolding with `.`, this is the cwd basename. */
  name: string;
  /** package.json / folder slug */
  slug: string;
  /**
   * Absolute output directory. Set by the CLI from the user target
   * (`my-app` or `.`). Falls back to `resolve(cwd, name)` if omitted.
   */
  outDir?: string;
  packageManager: PackageManager;
  auth: AuthOption;
  styling: StylingOption;
  ui: UiOption;
  /** Ignored unless ui === "shadcn" */
  shadcnSet: ShadcnSetOption;
  data: DataOption;
  store: StoreOption;
  icons: IconOption;
  validation: ValidationOption;
  i18n: boolean;
  /** Dark mode via next-themes (requires styling=tailwind | mui) */
  darkMode: boolean;
  /** Unwrap `{ result, status, success, messages }` API envelopes */
  apiEnvelope: boolean;
  /** OpenAPI → `src/endpoints` codegen + axios helpers */
  endpoints: boolean;
  /** SEO helpers: public-routes, sitemap, robots */
  seo: boolean;
  /** Enhanced ESLint (import sort, func-style, jsx-sort-props) */
  eslint: boolean;
  /** Prettier + format script */
  prettier: boolean;
  /** Husky + lint-staged pre-commit */
  husky: boolean;
  /** Deploy target: none | vercel | docker */
  deploy: DeployOption;
  /** GitHub Actions CI */
  ci: boolean;
  /** Vitest unit/component tests */
  testing: boolean;
  /** Playwright e2e (requires testing) */
  playwright: boolean;
  /** Skip dependency install after scaffold */
  noInstall: boolean;
};

export const DEFAULT_OPTIONS: Omit<ScaffoldOptions, "name" | "slug"> = {
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
  /** Neutral base — enable via preset / flags when building an API client app */
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
  noInstall: false,
};

export const ICON_PACKAGES: Record<
  Exclude<IconOption, "none">,
  { name: string; version: string }
> = {
  lucide: { name: "lucide-react", version: "^0.469.0" },
  tabler: { name: "@tabler/icons-react", version: "^3.46.0" },
};

/** Enforce incompatible combinations. */
export function normalizeOptions<T extends ScaffoldOptions>(options: T): T {
  let next = { ...options };

  if (next.styling !== "tailwind" && next.ui === "shadcn") {
    next = { ...next, ui: "none" };
  }
  if (next.ui !== "shadcn") {
    next = { ...next, shadcnSet: "minimal" };
  }
  if (
    next.darkMode &&
    next.styling !== "tailwind" &&
    next.styling !== "mui"
  ) {
    next = { ...next, darkMode: false };
  }
  if (next.playwright && !next.testing) {
    next = { ...next, testing: true };
  }

  return next;
}

/** @deprecated use normalizeOptions */
export function normalizeUiOptions<
  T extends Pick<ScaffoldOptions, "styling" | "ui">,
>(options: T): T {
  if (options.styling !== "tailwind" && options.ui === "shadcn") {
    return { ...options, ui: "none" };
  }
  return options;
}
