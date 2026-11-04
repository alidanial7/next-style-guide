import * as p from "@clack/prompts";
import color from "picocolors";

import { TITLE } from "./constants.js";
import { slugify } from "./helpers/slugify.js";
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
  type IconOption,
  type PackageManager,
  type ScaffoldOptions,
  type StoreOption,
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
  if (styling === "tailwind") {
    const useShadcn = assertNotCancel(
      await p.confirm({
        message: "Add shadcn/ui?",
        initialValue: base.ui === "shadcn",
      }),
    );
    ui = useShadcn ? "shadcn" : "none";
  }

  const icons = assertNotCancel(
    await p.select({
      message: "Icon library?",
      options: [
        { value: "none" satisfies IconOption, label: "None" },
        { value: "lucide" satisfies IconOption, label: "Lucide" },
        { value: "tabler" satisfies IconOption, label: "Tabler" },
      ],
      initialValue: base.icons,
    }),
  );

  const validation = assertNotCancel(
    await p.select({
      message: "Validation library?",
      options: [
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

  const seo = assertNotCancel(
    await p.confirm({
      message: "Add SEO helpers (sitemap/robots)?",
      initialValue: base.seo,
    }),
  );

  const i18n = assertNotCancel(
    await p.confirm({
      message: "Add i18n (next-intl)?",
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

  const docker = assertNotCancel(
    await p.confirm({
      message: "Add Docker production image?",
      initialValue: base.docker,
    }),
  );

  const ci = assertNotCancel(
    await p.confirm({
      message: "Add GitHub Actions CI?",
      initialValue: base.ci,
    }),
  );

  return {
    ...base,
    styling,
    ui,
    icons,
    validation,
    data: useTanstackQuery ? "tanstack-query" : "rsc",
    store,
    endpoints,
    apiEnvelope,
    auth,
    seo,
    i18n,
    testing,
    playwright,
    eslint,
    prettier,
    husky,
    docker,
    ci,
  };
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

  const draft = normalizeOptions({
    name: name.trim(),
    slug,
    ...optionSeed,
    packageManager,
    noInstall: false,
  });

  const warnings = collectOptionWarnings(draft);
  if (warnings.length) {
    p.log.warn(warnings.join("\n"));
  }

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

  return draft;
}
