import * as p from "@clack/prompts";
import color from "picocolors";
import path from "node:path";

import { PKG_NAME, TITLE } from "./constants.js";
import { getPackageManager } from "./helpers/package-manager.js";
import { slugify } from "./helpers/slugify.js";
import {
  collectOptionWarnings,
  PRESET_SEEDS,
  type PresetId,
} from "./presets.js";
import { runPrompts } from "./prompts.js";
import { scaffold } from "./scaffold.js";
import { runUpgrade } from "./upgrade.js";
import {
  DEFAULT_OPTIONS,
  normalizeOptions,
  type AuthOption,
  type DeployOption,
  type IconOption,
  type PackageManager,
  type ScaffoldOptions,
  type ShadcnSetOption,
  type StoreOption,
  type StylingOption,
  type ValidationOption,
} from "./types.js";

const ICON_VALUES = new Set<IconOption>(["none", "lucide", "tabler"]);
const STYLING_VALUES = new Set<StylingOption>(["none", "tailwind", "mui"]);
const VALIDATION_VALUES = new Set<ValidationOption>(["zod", "yup"]);
const AUTH_VALUES = new Set<AuthOption>(["none", "jwt", "authjs"]);
const STORE_VALUES = new Set<StoreOption>(["none", "zustand", "redux"]);
const PM_VALUES = new Set<PackageManager>(["pnpm", "npm", "yarn"]);
const SHADCN_SET_VALUES = new Set<ShadcnSetOption>(["minimal", "starter"]);
const DEPLOY_VALUES = new Set<DeployOption>(["none", "vercel", "docker"]);
const PRESET_VALUES = new Set<PresetId>([
  "custom",
  "minimal",
  "api-app",
  "marketing",
  "dashboard",
]);

type FlagBag = {
  name?: string;
  noInstall: boolean;
  yes: boolean;
  upgrade: boolean;
  apply: boolean;
  verbose: boolean;
  preset?: PresetId;
  packageManager?: PackageManager;
  icons?: IconOption;
  styling?: StylingOption;
  shadcn?: boolean;
  shadcnSet?: ShadcnSetOption;
  validation?: ValidationOption;
  auth?: AuthOption;
  store?: StoreOption;
  tanstackQuery?: boolean;
  endpoints?: boolean;
  apiEnvelope?: boolean;
  seo?: boolean;
  i18n?: boolean;
  darkMode?: boolean;
  testing?: boolean;
  playwright?: boolean;
  eslint?: boolean;
  prettier?: boolean;
  husky?: boolean;
  deploy?: DeployOption;
  ci?: boolean;
};

function parseBoolFlag(
  arg: string,
  positive: string,
  negative: string,
): boolean | undefined {
  if (arg === positive) return true;
  if (arg === negative) return false;
  return undefined;
}

function readChoice<T extends string>(
  arg: string,
  flag: string,
  values: Set<T>,
  args: string[],
  i: number,
): { value: T; nextIndex: number } | null {
  if (arg.startsWith(`${flag}=`)) {
    const value = arg.slice(flag.length + 1) as T;
    if (!values.has(value)) {
      throw new Error(`Invalid ${flag}=${value}.`);
    }
    return { value, nextIndex: i };
  }
  if (arg === flag) {
    const value = args[i + 1] as T | undefined;
    if (!value || !values.has(value)) {
      throw new Error(`Invalid ${flag}.`);
    }
    return { value, nextIndex: i + 1 };
  }
  return null;
}

function parseArgs(argv: string[]): FlagBag {
  const args = argv.slice(2);
  const out: FlagBag = {
    noInstall: false,
    yes: false,
    upgrade: false,
    apply: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;

    if (arg === "upgrade") {
      out.upgrade = true;
      continue;
    }
    if (arg === "--apply") {
      out.apply = true;
      continue;
    }
    if (arg === "--diff") {
      out.upgrade = true;
      out.apply = false;
      continue;
    }
    if (arg === "--verbose" || arg === "-V") {
      out.verbose = true;
      continue;
    }
    if (arg === "--no-install") {
      out.noInstall = true;
      continue;
    }
    if (arg === "--yes" || arg === "-y") {
      out.yes = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    const boolKeys = [
      ["tanstackQuery", "--tanstack-query", "--no-tanstack-query"],
      ["endpoints", "--endpoints", "--no-endpoints"],
      ["apiEnvelope", "--api-envelope", "--no-api-envelope"],
      ["seo", "--seo", "--no-seo"],
      ["i18n", "--i18n", "--no-i18n"],
      ["darkMode", "--dark-mode", "--no-dark-mode"],
      ["testing", "--testing", "--no-testing"],
      ["playwright", "--playwright", "--no-playwright"],
      ["eslint", "--eslint", "--no-eslint"],
      ["prettier", "--prettier", "--no-prettier"],
      ["husky", "--husky", "--no-husky"],
      ["ci", "--ci", "--no-ci"],
      ["shadcn", "--shadcn", "--no-shadcn"],
    ] as const;
    let matched = false;
    for (const [key, pos, neg] of boolKeys) {
      const v = parseBoolFlag(arg, pos, neg);
      if (v !== undefined) {
        out[key] = v;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const preset = readChoice(arg, "--preset", PRESET_VALUES, args, i);
    if (preset) {
      out.preset = preset.value;
      i = preset.nextIndex;
      continue;
    }
    const pm = readChoice(arg, "--pm", PM_VALUES, args, i);
    if (pm) {
      out.packageManager = pm.value;
      i = pm.nextIndex;
      continue;
    }
    const pmLong = readChoice(arg, "--package-manager", PM_VALUES, args, i);
    if (pmLong) {
      out.packageManager = pmLong.value;
      i = pmLong.nextIndex;
      continue;
    }
    const store = readChoice(arg, "--store", STORE_VALUES, args, i);
    if (store) {
      out.store = store.value;
      i = store.nextIndex;
      continue;
    }
    const styling = readChoice(arg, "--styling", STYLING_VALUES, args, i);
    if (styling) {
      out.styling = styling.value;
      i = styling.nextIndex;
      continue;
    }
    const validation = readChoice(
      arg,
      "--validation",
      VALIDATION_VALUES,
      args,
      i,
    );
    if (validation) {
      out.validation = validation.value;
      i = validation.nextIndex;
      continue;
    }
    const auth = readChoice(arg, "--auth", AUTH_VALUES, args, i);
    if (auth) {
      out.auth = auth.value;
      i = auth.nextIndex;
      continue;
    }
    const icons = readChoice(arg, "--icons", ICON_VALUES, args, i);
    if (icons) {
      out.icons = icons.value;
      i = icons.nextIndex;
      continue;
    }
    const shadcnSet = readChoice(arg, "--shadcn-set", SHADCN_SET_VALUES, args, i);
    if (shadcnSet) {
      out.shadcnSet = shadcnSet.value;
      out.shadcn = true;
      i = shadcnSet.nextIndex;
      continue;
    }
    const deploy = readChoice(arg, "--deploy", DEPLOY_VALUES, args, i);
    if (deploy) {
      out.deploy = deploy.value;
      i = deploy.nextIndex;
      continue;
    }
    // Back-compat aliases
    if (arg === "--docker") {
      out.deploy = "docker";
      continue;
    }
    if (arg === "--no-docker") {
      if (out.deploy === undefined || out.deploy === "docker") {
        out.deploy = "none";
      }
      continue;
    }

    if (!arg.startsWith("-") && !out.name) {
      out.name = arg;
    }
  }

  return out;
}

function printHelp(): void {
  console.log(`
${TITLE} — ${PKG_NAME}

Usage:
  npx create-next-style-guide [name] [options]
  npx create-next-style-guide upgrade [--apply] [dir]
  npx create-next-style-guide --diff [dir]

Options:
  --yes, -y
  --no-install
  --preset minimal|api-app|marketing|dashboard|custom
  --pm, --package-manager pnpm|npm|yarn
  --store none|zustand|redux
  --styling none|tailwind|mui
  --shadcn | --no-shadcn
  --shadcn-set minimal|starter
  --dark-mode | --no-dark-mode
  --validation zod|yup
  --auth none|jwt|authjs
  --icons none|lucide|tabler
  --tanstack-query | --no-tanstack-query
  --endpoints | --no-endpoints
  --api-envelope | --no-api-envelope
  --seo | --no-seo
  --i18n | --no-i18n
  --testing | --no-testing
  --playwright | --no-playwright
  --eslint | --no-eslint
  --prettier | --no-prettier
  --husky | --no-husky
  --deploy none|vercel|docker
  --docker | --no-docker   (alias for --deploy docker / none)
  --ci | --no-ci
  --verbose, -V       advisory tips (e.g. Query vs store)
  --help, -h

Upgrade:
  upgrade [--apply]   Diff (default) or apply AGENTS.md + core .cursor/rules
  --diff              Alias for upgrade without --apply
`);
}

function applyFlagOverrides(
  options: ScaffoldOptions,
  flags: FlagBag,
): ScaffoldOptions {
  let next = { ...options };
  if (flags.packageManager !== undefined) {
    next.packageManager = flags.packageManager;
  }
  if (flags.icons !== undefined) next.icons = flags.icons;
  if (flags.styling !== undefined) next.styling = flags.styling;
  if (flags.shadcn !== undefined) next.ui = flags.shadcn ? "shadcn" : "none";
  if (flags.shadcnSet !== undefined) {
    next.shadcnSet = flags.shadcnSet;
    next.ui = "shadcn";
  }
  if (flags.validation !== undefined) next.validation = flags.validation;
  if (flags.auth !== undefined) next.auth = flags.auth;
  if (flags.store !== undefined) next.store = flags.store;
  if (flags.tanstackQuery !== undefined) {
    next.data = flags.tanstackQuery ? "tanstack-query" : "rsc";
  }
  if (flags.endpoints !== undefined) next.endpoints = flags.endpoints;
  if (flags.apiEnvelope !== undefined) next.apiEnvelope = flags.apiEnvelope;
  if (flags.seo !== undefined) next.seo = flags.seo;
  if (flags.i18n !== undefined) next.i18n = flags.i18n;
  if (flags.darkMode !== undefined) next.darkMode = flags.darkMode;
  if (flags.testing !== undefined) next.testing = flags.testing;
  if (flags.playwright !== undefined) next.playwright = flags.playwright;
  if (flags.eslint !== undefined) next.eslint = flags.eslint;
  if (flags.prettier !== undefined) next.prettier = flags.prettier;
  if (flags.husky !== undefined) next.husky = flags.husky;
  if (flags.deploy !== undefined) next.deploy = flags.deploy;
  if (flags.ci !== undefined) next.ci = flags.ci;
  return normalizeOptions(next);
}

async function main(): Promise<void> {
  const flags = parseArgs(process.argv);

  if (flags.upgrade) {
    const projectDir = path.resolve(process.cwd(), flags.name ?? ".");
    await runUpgrade({ projectDir, apply: flags.apply });
    return;
  }

  let options: ScaffoldOptions;

  if (flags.yes) {
    const name = (flags.name ?? "my-app").trim();
    const presetSeed =
      flags.preset && flags.preset !== "custom"
        ? PRESET_SEEDS[flags.preset]
        : DEFAULT_OPTIONS;

    options = applyFlagOverrides(
      {
        name,
        slug: slugify(name),
        ...presetSeed,
        noInstall: flags.noInstall,
      },
      flags,
    );
    p.intro(color.bgCyan(color.black(` ${TITLE} `)));
    p.log.info(
      [
        `Non-interactive: ${options.name} (${options.slug})`,
        flags.preset ? `preset=${flags.preset}` : null,
        `pm=${options.packageManager}`,
        `styling=${options.styling} ui=${options.ui}${options.ui === "shadcn" ? `:${options.shadcnSet}` : ""} auth=${options.auth} store=${options.store}`,
        `deploy=${options.deploy} endpoints=${options.endpoints} seo=${options.seo} i18n=${options.i18n} testing=${options.testing}`,
      ]
        .filter(Boolean)
        .join(" · "),
    );
  } else {
    options = await runPrompts(flags.name);
    options.noInstall = flags.noInstall;
    options = applyFlagOverrides(options, flags);
  }

  const warnings = collectOptionWarnings(options, { verbose: flags.verbose });
  for (const warning of warnings) {
    p.log.warn(warning);
  }

  const projectDir = await scaffold(options);
  const pm = getPackageManager(options.packageManager);

  const nextSteps = [
    `cd ${path.relative(process.cwd(), projectDir) || "."}`,
    options.noInstall ? `${pm.id} ${pm.installArgs.filter((a) => a !== "--ignore-workspace").join(" ")}`.trim() : null,
    options.ui === "shadcn" && options.shadcnSet === "minimal"
      ? "npx shadcn@latest add input   # or re-scaffold with --shadcn-set starter"
      : null,
    options.endpoints
      ? `${pm.runScript("endpoints:generate")}   # when API schema is up`
      : null,
    options.testing ? pm.runScript("test") : null,
    pm.runScript("dev"),
  ].filter(Boolean);

  p.note(nextSteps.join("\n"), "Next steps");
  p.outro(color.green("Done. Happy shipping."));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  p.log.error(message);
  p.cancel("Scaffold failed.");
  process.exit(1);
});
