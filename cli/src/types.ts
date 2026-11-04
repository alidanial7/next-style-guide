/**
 * Scaffold options.
 * Base ships with safe defaults; installers flip features on.
 */
export type AuthOption = "none" | "django-jwt" | "authjs";
export type UiOption = "none" | "shadcn";
export type DataOption = "rsc" | "tanstack-query";
export type IconOption = "none" | "lucide" | "tabler";

export type ScaffoldOptions = {
  /** Output directory / display name */
  name: string;
  /** package.json / folder slug */
  slug: string;
  auth: AuthOption;
  ui: UiOption;
  data: DataOption;
  icons: IconOption;
  i18n: boolean;
  /** Typed fetch client matched to django-style-guide envelope */
  djangoEnvelope: boolean;
  /** OpenAPI → `src/endpoints` codegen + axios helpers */
  endpoints: boolean;
  /** Husky + lint-staged + Prettier pre-commit */
  husky: boolean;
  testing: boolean;
  ci: boolean;
  /** Skip dependency install after scaffold */
  noInstall: boolean;
};

export const DEFAULT_OPTIONS: Omit<ScaffoldOptions, "name" | "slug"> = {
  auth: "none",
  ui: "none",
  data: "rsc",
  icons: "none",
  i18n: false,
  djangoEnvelope: true,
  endpoints: true,
  husky: true,
  testing: true,
  ci: false,
  noInstall: false,
};

export const ICON_PACKAGES: Record<
  Exclude<IconOption, "none">,
  { name: string; version: string }
> = {
  lucide: { name: "lucide-react", version: "^0.469.0" },
  tabler: { name: "@tabler/icons-react", version: "^3.46.0" },
};
