/**
 * Scaffold options.
 * Base ships with safe defaults; installers flip features on.
 */
export type AuthOption = "none" | "django-jwt" | "authjs";
/** CSS / component system foundation */
export type StylingOption = "none" | "tailwind" | "mui";
/** shadcn only valid when styling === "tailwind" */
export type UiOption = "none" | "shadcn";
export type DataOption = "rsc" | "tanstack-query";
export type IconOption = "none" | "lucide" | "tabler";
export type ValidationOption = "zod" | "yup";

export type ScaffoldOptions = {
  /** Output directory / display name */
  name: string;
  /** package.json / folder slug */
  slug: string;
  auth: AuthOption;
  styling: StylingOption;
  ui: UiOption;
  data: DataOption;
  icons: IconOption;
  validation: ValidationOption;
  i18n: boolean;
  /** Typed fetch client matched to django-style-guide envelope */
  djangoEnvelope: boolean;
  /** OpenAPI → `src/endpoints` codegen + axios helpers */
  endpoints: boolean;
  /** Enhanced ESLint (import sort, func-style, jsx-sort-props) */
  eslint: boolean;
  /** Prettier + format script */
  prettier: boolean;
  /** Husky + lint-staged pre-commit */
  husky: boolean;
  /** Multi-stage Docker (standalone Next) */
  docker: boolean;
  /** GitHub Actions CI */
  ci: boolean;
  testing: boolean;
  /** Skip dependency install after scaffold */
  noInstall: boolean;
};

export const DEFAULT_OPTIONS: Omit<ScaffoldOptions, "name" | "slug"> = {
  auth: "none",
  styling: "none",
  ui: "none",
  data: "rsc",
  icons: "none",
  validation: "zod",
  i18n: false,
  djangoEnvelope: true,
  endpoints: true,
  eslint: true,
  prettier: true,
  husky: true,
  docker: false,
  ci: true,
  testing: true,
  noInstall: false,
};

export const ICON_PACKAGES: Record<
  Exclude<IconOption, "none">,
  { name: string; version: string }
> = {
  lucide: { name: "lucide-react", version: "^0.469.0" },
  tabler: { name: "@tabler/icons-react", version: "^3.46.0" },
};

/** Enforce incompatible UI combinations. */
export function normalizeUiOptions<T extends Pick<ScaffoldOptions, "styling" | "ui">>(
  options: T,
): T {
  if (options.styling !== "tailwind" && options.ui === "shadcn") {
    return { ...options, ui: "none" };
  }
  return options;
}
