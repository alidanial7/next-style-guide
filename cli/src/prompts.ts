import * as p from "@clack/prompts";
import color from "picocolors";

import { TITLE } from "./constants.js";
import { slugify } from "./helpers/slugify.js";
import {
  DEFAULT_OPTIONS,
  normalizeUiOptions,
  type AuthOption,
  type IconOption,
  type ScaffoldOptions,
  type StylingOption,
  type ValidationOption,
} from "./types.js";

function assertNotCancel<T>(value: T | symbol): T {
  if (p.isCancel(value)) {
    p.cancel("Scaffold cancelled.");
    process.exit(0);
  }
  return value;
}

/** Interactive prompts for scaffold options. */
export async function runPrompts(
  initialName?: string,
): Promise<ScaffoldOptions> {
  p.intro(color.bgCyan(color.black(` ${TITLE} `)));

  const name = assertNotCancel(
    await p.text({
      message: "Project name?",
      placeholder: "my-app",
      initialValue: initialName ?? "my-app",
      validate(value) {
        if (!value.trim()) return "Name is required.";
        try {
          slugify(value);
        } catch (error) {
          return error instanceof Error ? error.message : "Invalid name.";
        }
      },
    }),
  );

  const slug = slugify(name);

  const styling = assertNotCancel(
    await p.select({
      message: "Styling system?",
      options: [
        {
          value: "none" satisfies StylingOption,
          label: "None",
          hint: "plain CSS (base template)",
        },
        {
          value: "tailwind" satisfies StylingOption,
          label: "Tailwind CSS",
          hint: "utilities · enables optional shadcn",
        },
        {
          value: "mui" satisfies StylingOption,
          label: "MUI",
          hint: "Material UI — no shadcn",
        },
      ],
      initialValue: DEFAULT_OPTIONS.styling,
    }),
  );

  let ui: ScaffoldOptions["ui"] = "none";
  if (styling === "tailwind") {
    const useShadcn = assertNotCancel(
      await p.confirm({
        message: "Add shadcn/ui?",
        initialValue: false,
      }),
    );
    ui = useShadcn ? "shadcn" : "none";
  }

  const icons = assertNotCancel(
    await p.select({
      message: "Icon library?",
      options: [
        {
          value: "none" satisfies IconOption,
          label: "None",
          hint: ui === "shadcn" ? "shadcn will still add lucide" : "add later",
        },
        {
          value: "lucide" satisfies IconOption,
          label: "Lucide",
          hint: "common with shadcn",
        },
        {
          value: "tabler" satisfies IconOption,
          label: "Tabler",
          hint: "@tabler/icons-react — Icon* prefix",
        },
      ],
      initialValue: DEFAULT_OPTIONS.icons,
    }),
  );

  const validation = assertNotCancel(
    await p.select({
      message: "Validation library?",
      options: [
        {
          value: "zod" satisfies ValidationOption,
          label: "Zod",
          hint: "default · typed schemas",
        },
        {
          value: "yup" satisfies ValidationOption,
          label: "Yup",
          hint: "schema builder · InferType",
        },
      ],
      initialValue: DEFAULT_OPTIONS.validation,
    }),
  );

  const useTanstackQuery = assertNotCancel(
    await p.confirm({
      message: "Add TanStack Query (React Query)?",
      initialValue: DEFAULT_OPTIONS.data === "tanstack-query",
    }),
  );

  const endpoints = assertNotCancel(
    await p.confirm({
      message: "Add OpenAPI endpoints codegen (`pnpm endpoints:generate`)?",
      initialValue: DEFAULT_OPTIONS.endpoints,
    }),
  );

  const auth = assertNotCancel(
    await p.select({
      message: "Auth?",
      options: [
        {
          value: "none" satisfies AuthOption,
          label: "None",
          hint: "add later",
        },
        {
          value: "jwt" satisfies AuthOption,
          label: "JWT",
          hint: "Bearer + refresh · token-storage",
        },
        {
          value: "authjs" satisfies AuthOption,
          label: "Auth.js",
          hint: "NextAuth stub",
        },
      ],
      initialValue: DEFAULT_OPTIONS.auth,
    }),
  );

  const seo = assertNotCancel(
    await p.confirm({
      message: "Add SEO helpers (public-routes, sitemap, robots)?",
      initialValue: DEFAULT_OPTIONS.seo,
    }),
  );

  const eslint = assertNotCancel(
    await p.confirm({
      message: "Enhanced ESLint (import sort, func-style, jsx-sort-props)?",
      initialValue: DEFAULT_OPTIONS.eslint,
    }),
  );

  const prettier = assertNotCancel(
    await p.confirm({
      message: "Add Prettier?",
      initialValue: DEFAULT_OPTIONS.prettier,
    }),
  );

  const husky = assertNotCancel(
    await p.confirm({
      message: "Add Husky + lint-staged (pre-commit)?",
      initialValue: DEFAULT_OPTIONS.husky,
    }),
  );

  const docker = assertNotCancel(
    await p.confirm({
      message: "Add Docker production image (standalone Next)?",
      initialValue: DEFAULT_OPTIONS.docker,
    }),
  );

  const ci = assertNotCancel(
    await p.confirm({
      message: "Add GitHub Actions CI?",
      initialValue: DEFAULT_OPTIONS.ci,
    }),
  );

  const confirmed = assertNotCancel(
    await p.confirm({
      message: `Create ${color.cyan(name)} (${color.dim(slug)})?`,
      initialValue: true,
    }),
  );

  if (!confirmed) {
    p.cancel("Scaffold cancelled.");
    process.exit(0);
  }

  return normalizeUiOptions({
    name: name.trim(),
    slug,
    ...DEFAULT_OPTIONS,
    styling,
    ui,
    icons,
    validation,
    data: useTanstackQuery ? ("tanstack-query" as const) : ("rsc" as const),
    endpoints,
    auth,
    seo,
    eslint,
    prettier,
    husky,
    docker,
    ci,
  });
}
