import * as p from "@clack/prompts";
import color from "picocolors";

import { TITLE } from "./constants.js";
import { resolveProjectTarget } from "./helpers/project-target.js";
import {
  collectOptionWarnings,
  describePreset,
  PRESET_SEEDS,
  type PresetId,
} from "./presets.js";
import {
  DEFAULT_OPTIONS,
  normalizeOptions,
  type AuthOption,
  type CiOption,
  type DeployOption,
  type DirectionOption,
  type IconOption,
  type PackageManager,
  type ScaffoldOptions,
  type ShadcnSetOption,
  type StoreOption,
  type StylingOption,
  type ValidationOption,
} from "./types.js";

function assertNotCancel<T>(value: T): Exclude<T, symbol> {
  if (p.isCancel(value)) {
    p.cancel("Scaffold cancelled.");
    process.exit(0);
  }
  return value as Exclude<T, symbol>;
}

async function promptCustomOptions(
  base: Omit<ScaffoldOptions, "name" | "slug" | "noInstall">,
): Promise<Omit<ScaffoldOptions, "name" | "slug" | "noInstall">> {
  const styling = assertNotCancel(
    await p.select({
      message: "Styling system?",
      options: [
        { value: "none" satisfies StylingOption, label: "None", hint: "plain CSS" },
        {
          value: "tailwind" satisfies StylingOption,
          label: "Tailwind CSS",
          hint: "enables optional shadcn",
        },
        {
          value: "mui" satisfies StylingOption,
          label: "MUI",
          hint: "no shadcn",
        },
      ],
      initialValue: base.styling,
    }),
  );

  let ui: ScaffoldOptions["ui"] = "none";
  let shadcnSet: ShadcnSetOption = "minimal";
  let darkMode = false;
  if (styling === "tailwind") {
    const useShadcn = assertNotCancel(
      await p.confirm({
        message: "Add shadcn/ui?",
        initialValue: base.ui === "shadcn",
      }),
    );
    ui = useShadcn ? "shadcn" : "none";
    if (useShadcn) {
      shadcnSet = assertNotCancel(
        await p.select({
          message: "shadcn component set?",
          options: [
            {
              value: "minimal" satisfies ShadcnSetOption,
              label: "Minimal",
              hint: "Button only",
            },
            {
              value: "starter" satisfies ShadcnSetOption,
              label: "Starter",
              hint: "Button · Input · Card · Dialog",
            },
          ],
          initialValue: base.shadcnSet,
        }),
      );
    }
  }
  if (styling === "tailwind" || styling === "mui") {
    darkMode = assertNotCancel(
      await p.confirm({
        message:
          styling === "mui"
            ? "Add dark mode (ThemeProvider ↔ MUI palette)?"
            : "Add dark mode (ThemeProvider + Tailwind dark:)?",
        initialValue: base.darkMode,
      }),
    );
  }

  const direction = assertNotCancel(
    await p.select({
      message: "Text direction?",
      options: [
        {
          value: "ltr" satisfies DirectionOption,
          label: "LTR only",
          hint: "dir=ltr",
        },
        {
          value: "rtl" satisfies DirectionOption,
          label: "RTL only",
          hint: "dir=rtl · MUI stylis RTL when applicable",
        },
        {
          value: "both" satisfies DirectionOption,
          label: "Both (toggle)",
          hint: "runtime switch + sample UI · hook useDirection",
        },
      ],
      initialValue: base.direction,
    }),
  );

  const icons = assertNotCancel(
    await p.select({
      message:
        ui === "shadcn"
          ? "Icon library? (shadcn needs one — Lucide or Tabler)"
          : "Icon library?",
      options:
        ui === "shadcn"
          ? [
              {
                value: "lucide" as const,
                label: "Lucide",
                hint: "usual shadcn default",
              },
              {
                value: "tabler" as const,
                label: "Tabler",
                hint: "fine with shadcn too",
              },
            ]
          : [
              { value: "none" as const, label: "None" },
              { value: "lucide" as const, label: "Lucide" },
              { value: "tabler" as const, label: "Tabler" },
            ],
      initialValue:
        ui === "shadcn"
          ? base.icons === "tabler"
            ? ("tabler" as const)
            : ("lucide" as const)
          : base.icons,
    }),
  ) as IconOption;

  const validation = assertNotCancel(
    await p.select({
      message: "Validation library?",
      options: [
        {
          value: "none" satisfies ValidationOption,
          label: "None",
          hint: "plain env helpers",
        },
        { value: "zod" satisfies ValidationOption, label: "Zod" },
        { value: "yup" satisfies ValidationOption, label: "Yup" },
      ],
      initialValue: base.validation,
    }),
  );

  const useTanstackQuery = assertNotCancel(
    await p.confirm({
      message: "Add TanStack Query?",
      initialValue: base.data === "tanstack-query",
    }),
  );

  const needsStore = assertNotCancel(
    await p.confirm({
      message: "Add a client store (global UI state)?",
      initialValue: base.store !== "none",
    }),
  );

  let store: StoreOption = "none";
  if (needsStore) {
    store = assertNotCancel(
      await p.select({
        message: "Which store library?",
        options: [
          {
            value: "zustand" satisfies StoreOption,
            label: "Zustand",
            hint: "lightweight",
          },
          {
            value: "redux" satisfies StoreOption,
            label: "Redux Toolkit",
            hint: "structured slices",
          },
        ],
        initialValue: base.store === "redux" ? "redux" : "zustand",
      }),
    );
  }

  const endpoints = assertNotCancel(
    await p.confirm({
      message: "Add OpenAPI endpoints codegen?",
      initialValue: base.endpoints,
    }),
  );

  let apiEnvelope = base.apiEnvelope;
  if (endpoints) {
    apiEnvelope = assertNotCancel(
      await p.confirm({
        message: "Unwrap API envelopes in http/axios helpers?",
        initialValue: true,
      }),
    );
  } else {
    apiEnvelope = assertNotCancel(
      await p.confirm({
        message: "Unwrap API envelopes in apiFetch (lib/http.ts)?",
        initialValue: false,
      }),
    );
  }

  const auth = assertNotCancel(
    await p.select({
      message: "Auth?",
      options: [
        { value: "none" satisfies AuthOption, label: "None" },
        {
          value: "jwt" satisfies AuthOption,
          label: "JWT",
          hint: "Bearer + refresh",
        },
        {
          value: "authjs" satisfies AuthOption,
          label: "Auth.js",
          hint: "Credentials demo",
        },
      ],
      initialValue: base.auth,
    }),
  );

  let dockerCompose = false;
  if (auth === "jwt" && endpoints) {
    dockerCompose = assertNotCancel(
      await p.confirm({
        message: "Add Docker Compose local API stub?",
        initialValue: base.dockerCompose,
      }),
    );
  }

  const seo = assertNotCancel(
    await p.confirm({
      message: "Add SEO helpers (sitemap/robots)?",
      initialValue: base.seo,
    }),
  );

  const i18n = assertNotCancel(
    await p.confirm({
      message: "Add i18n (next-intl · en/fa · /[locale] routing)?",
      initialValue: base.i18n,
    }),
  );

  const testing = assertNotCancel(
    await p.confirm({
      message: "Add Vitest?",
      initialValue: base.testing,
    }),
  );

  let playwright = false;
  if (testing) {
    playwright = assertNotCancel(
      await p.confirm({
        message: "Also add Playwright e2e?",
        initialValue: base.playwright,
      }),
    );
  }

  const eslint = assertNotCancel(
    await p.confirm({
      message: "Enhanced ESLint?",
      initialValue: base.eslint,
    }),
  );

  const prettier = assertNotCancel(
    await p.confirm({
      message: "Add Prettier?",
      initialValue: base.prettier,
    }),
  );

  const husky = assertNotCancel(
    await p.confirm({
      message: "Add Husky + lint-staged?",
      initialValue: base.husky,
    }),
  );

  const deploy = assertNotCancel(
    await p.select({
      message: "Deployment target?",
      options: [
        {
          value: "none" satisfies DeployOption,
          label: "None",
          hint: "no deploy files",
        },
        {
          value: "vercel" satisfies DeployOption,
          label: "Vercel",
          hint: "vercel.json + docs",
        },
        {
          value: "docker" satisfies DeployOption,
          label: "Docker",
          hint: "standalone production image",
        },
      ],
      initialValue: base.deploy,
    }),
  );

  const ci = assertNotCancel(
    await p.select({
      message: "CI provider?",
      options: [
        {
          value: "none" satisfies CiOption,
          label: "None",
          hint: "no pipeline files",
        },
        {
          value: "github" satisfies CiOption,
          label: "GitHub Actions",
          hint: ".github/workflows/ci.yml",
        },
        {
          value: "gitlab" satisfies CiOption,
          label: "GitLab CI",
          hint: ".gitlab-ci.yml",
        },
      ],
      initialValue: base.ci,
    }),
  );

  return {
    ...base,
    styling,
    ui,
    shadcnSet,
    darkMode,
    direction,
    icons,
    validation,
    data: useTanstackQuery ? "tanstack-query" : "rsc",
    store,
    endpoints,
    apiEnvelope,
    auth,
    dockerCompose,
    seo,
    i18n,
    testing,
    playwright,
    eslint,
    prettier,
    husky,
    deploy,
    ci,
  };
}

/** Interactive prompts for scaffold options. */
export async function runPrompts(
  initialName?: string,
): Promise<ScaffoldOptions> {
  p.intro(color.bgCyan(color.black(` ${TITLE} `)));

  const rawName = assertNotCancel(
    await p.text({
      message: "Project name? (use . for current directory)",
      placeholder: "my-app",
      initialValue: initialName ?? "my-app",
      validate(value) {
        const next = value ?? "";
        if (!next.trim()) return "Name is required.";
        try {
          resolveProjectTarget(next);
        } catch (error) {
          return error instanceof Error ? error.message : "Invalid name.";
        }
      },
    }),
  );

  const target = resolveProjectTarget(rawName);
  const { name, slug, outDir } = target;
  if (target.inPlace) {
    p.log.info(`Scaffolding into current directory → ${outDir}`);
  }

  const packageManager = assertNotCancel(
    await p.select({
      message: "Package manager?",
      options: [
        { value: "pnpm" as const, label: "pnpm", hint: "default" },
        { value: "npm" as const, label: "npm" },
        { value: "yarn" as const, label: "yarn", hint: "classic" },
      ],
      initialValue: "pnpm" as const,
    }),
  ) as PackageManager;

  const preset = assertNotCancel(
    await p.select({
      message: "Preset?",
      options: [
        {
          value: "minimal" as const,
          label: "Minimal",
          hint: describePreset("minimal"),
        },
        {
          value: "api-app" as const,
          label: "API app",
          hint: describePreset("api-app"),
        },
        {
          value: "marketing" as const,
          label: "Marketing / site",
          hint: describePreset("marketing"),
        },
        {
          value: "dashboard" as const,
          label: "Dashboard",
          hint: describePreset("dashboard"),
        },
        {
          value: "mui-app" as const,
          label: "MUI app",
          hint: describePreset("mui-app"),
        },
        {
          value: "custom" as const,
          label: "Custom",
          hint: "answer every question",
        },
      ],
      initialValue: "custom" as const,
    }),
  ) as PresetId;

  let optionSeed: Omit<ScaffoldOptions, "name" | "slug" | "noInstall"> =
    preset === "custom"
      ? { ...DEFAULT_OPTIONS, packageManager }
      : { ...PRESET_SEEDS[preset], packageManager };

  if (preset === "custom") {
    optionSeed = await promptCustomOptions(optionSeed);
  } else {
    p.note(describePreset(preset), `Preset: ${preset}`);
    const tweak = assertNotCancel(
      await p.confirm({
        message: "Customize this preset further?",
        initialValue: false,
      }),
    );
    if (tweak) {
      optionSeed = await promptCustomOptions(optionSeed);
    }
  }

  const draftRaw = {
    name: name.trim(),
    slug,
    outDir,
    ...optionSeed,
    packageManager,
    noInstall: false,
  };
  const warnings = collectOptionWarnings(draftRaw);
  if (warnings.length) {
    p.log.warn(warnings.join("\n"));
  }
  const draft = normalizeOptions(draftRaw);

  const confirmed = assertNotCancel(
    await p.confirm({
      message: target.inPlace
        ? `Create ${color.cyan(name)} (${color.dim(slug)}) in ${color.dim(".")}?`
        : `Create ${color.cyan(name)} (${color.dim(slug)})?`,
      initialValue: true,
    }),
  );

  if (!confirmed) {
    p.cancel("Scaffold cancelled.");
    process.exit(0);
  }

  return draft;
}
