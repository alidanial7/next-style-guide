import * as p from "@clack/prompts";
import color from "picocolors";
import path from "node:path";

import { PKG_NAME, TITLE } from "./constants.js";
import { slugify } from "./helpers/slugify.js";
import { runPrompts } from "./prompts.js";
import { scaffold } from "./scaffold.js";
import {
  DEFAULT_OPTIONS,
  normalizeUiOptions,
  type AuthOption,
  type IconOption,
  type ScaffoldOptions,
  type StylingOption,
  type ValidationOption,
} from "./types.js";

const ICON_VALUES = new Set<IconOption>(["none", "lucide", "tabler"]);
const STYLING_VALUES = new Set<StylingOption>(["none", "tailwind", "mui"]);
const VALIDATION_VALUES = new Set<ValidationOption>(["zod", "yup"]);
const AUTH_VALUES = new Set<AuthOption>(["none", "jwt", "authjs"]);

type FlagBag = {
  name?: string;
  noInstall: boolean;
  yes: boolean;
  icons?: IconOption;
  styling?: StylingOption;
  shadcn?: boolean;
  validation?: ValidationOption;
  auth?: AuthOption;
  tanstackQuery?: boolean;
  endpoints?: boolean;
  seo?: boolean;
  eslint?: boolean;
  prettier?: boolean;
  husky?: boolean;
  docker?: boolean;
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

function parseArgs(argv: string[]): FlagBag {
  const args = argv.slice(2);
  const out: FlagBag = { noInstall: false, yes: false };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;

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

    const tq = parseBoolFlag(arg, "--tanstack-query", "--no-tanstack-query");
    if (tq !== undefined) {
      out.tanstackQuery = tq;
      continue;
    }
    const ep = parseBoolFlag(arg, "--endpoints", "--no-endpoints");
    if (ep !== undefined) {
      out.endpoints = ep;
      continue;
    }
    const seo = parseBoolFlag(arg, "--seo", "--no-seo");
    if (seo !== undefined) {
      out.seo = seo;
      continue;
    }
    const es = parseBoolFlag(arg, "--eslint", "--no-eslint");
    if (es !== undefined) {
      out.eslint = es;
      continue;
    }
    const pr = parseBoolFlag(arg, "--prettier", "--no-prettier");
    if (pr !== undefined) {
      out.prettier = pr;
      continue;
    }
    const hk = parseBoolFlag(arg, "--husky", "--no-husky");
    if (hk !== undefined) {
      out.husky = hk;
      continue;
    }
    const dk = parseBoolFlag(arg, "--docker", "--no-docker");
    if (dk !== undefined) {
      out.docker = dk;
      continue;
    }
    const ci = parseBoolFlag(arg, "--ci", "--no-ci");
    if (ci !== undefined) {
      out.ci = ci;
      continue;
    }
    const sc = parseBoolFlag(arg, "--shadcn", "--no-shadcn");
    if (sc !== undefined) {
      out.shadcn = sc;
      continue;
    }

    if (arg.startsWith("--styling=")) {
      const value = arg.slice("--styling=".length) as StylingOption;
      if (!STYLING_VALUES.has(value)) {
        throw new Error(
          `Invalid --styling=${value}. Use none | tailwind | mui.`,
        );
      }
      out.styling = value;
      continue;
    }
    if (arg === "--styling") {
      const value = args[i + 1] as StylingOption | undefined;
      if (!value || !STYLING_VALUES.has(value)) {
        throw new Error(`Invalid --styling. Use none | tailwind | mui.`);
      }
      out.styling = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--validation=")) {
      const value = arg.slice("--validation=".length) as ValidationOption;
      if (!VALIDATION_VALUES.has(value)) {
        throw new Error(`Invalid --validation=${value}. Use zod | yup.`);
      }
      out.validation = value;
      continue;
    }
    if (arg === "--validation") {
      const value = args[i + 1] as ValidationOption | undefined;
      if (!value || !VALIDATION_VALUES.has(value)) {
        throw new Error(`Invalid --validation. Use zod | yup.`);
      }
      out.validation = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--auth=")) {
      const value = arg.slice("--auth=".length) as AuthOption;
      if (!AUTH_VALUES.has(value)) {
        throw new Error(`Invalid --auth=${value}. Use none | jwt | authjs.`);
      }
      out.auth = value;
      continue;
    }
    if (arg === "--auth") {
      const value = args[i + 1] as AuthOption | undefined;
      if (!value || !AUTH_VALUES.has(value)) {
        throw new Error(`Invalid --auth. Use none | jwt | authjs.`);
      }
      out.auth = value;
      i += 1;
      continue;
    }

    if (arg.startsWith("--icons=")) {
      const value = arg.slice("--icons=".length) as IconOption;
      if (!ICON_VALUES.has(value)) {
        throw new Error(
          `Invalid --icons=${value}. Use none | lucide | tabler.`,
        );
      }
      out.icons = value;
      continue;
    }
    if (arg === "--icons") {
      const value = args[i + 1] as IconOption | undefined;
      if (!value || !ICON_VALUES.has(value)) {
        throw new Error(`Invalid --icons. Use none | lucide | tabler.`);
      }
      out.icons = value;
      i += 1;
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
  pnpm create next-style-guide
  npx create-next-style-guide [name] [options]

Options:
  --yes, -y              Skip prompts (use defaults + other flags)
  --no-install           Skip dependency install
  --styling <name>       none | tailwind | mui
  --shadcn | --no-shadcn
  --validation <name>    zod | yup
  --auth <name>          none | jwt | authjs
  --icons <name>         none | lucide | tabler
  --tanstack-query | --no-tanstack-query
  --endpoints | --no-endpoints
  --seo | --no-seo
  --eslint | --no-eslint
  --prettier | --no-prettier
  --husky | --no-husky
  --docker | --no-docker
  --ci | --no-ci
  --help, -h             Show help
`);
}

function applyFlagOverrides(
  options: ScaffoldOptions,
  flags: FlagBag,
): ScaffoldOptions {
  let next = { ...options };
  if (flags.icons !== undefined) next.icons = flags.icons;
  if (flags.styling !== undefined) next.styling = flags.styling;
  if (flags.shadcn !== undefined) next.ui = flags.shadcn ? "shadcn" : "none";
  if (flags.validation !== undefined) next.validation = flags.validation;
  if (flags.auth !== undefined) next.auth = flags.auth;
  if (flags.tanstackQuery !== undefined) {
    next.data = flags.tanstackQuery ? "tanstack-query" : "rsc";
  }
  if (flags.endpoints !== undefined) next.endpoints = flags.endpoints;
  if (flags.seo !== undefined) next.seo = flags.seo;
  if (flags.eslint !== undefined) next.eslint = flags.eslint;
  if (flags.prettier !== undefined) next.prettier = flags.prettier;
  if (flags.husky !== undefined) next.husky = flags.husky;
  if (flags.docker !== undefined) next.docker = flags.docker;
  if (flags.ci !== undefined) next.ci = flags.ci;
  next = normalizeUiOptions(next);
  return next;
}

async function main(): Promise<void> {
  const flags = parseArgs(process.argv);

  let options: ScaffoldOptions;

  if (flags.yes) {
    const name = (flags.name ?? "my-app").trim();
    options = applyFlagOverrides(
      {
        name,
        slug: slugify(name),
        ...DEFAULT_OPTIONS,
        noInstall: flags.noInstall,
      },
      flags,
    );
    p.intro(color.bgCyan(color.black(` ${TITLE} `)));
    p.log.info(
      [
        `Non-interactive: ${options.name} (${options.slug})`,
        `styling=${options.styling} ui=${options.ui} validation=${options.validation} auth=${options.auth}`,
        `icons=${options.icons} data=${options.data} seo=${options.seo}`,
        `endpoints=${options.endpoints} eslint=${options.eslint} prettier=${options.prettier}`,
        `husky=${options.husky} docker=${options.docker} ci=${options.ci}`,
      ].join(" · "),
    );
  } else {
    options = await runPrompts(flags.name);
    options.noInstall = flags.noInstall;
    options = applyFlagOverrides(options, flags);
  }

  const projectDir = await scaffold(options);

  const nextSteps = [
    `cd ${path.relative(process.cwd(), projectDir) || "."}`,
    options.noInstall ? "pnpm install" : null,
    options.ui === "shadcn" ? "npx shadcn@latest add button   # example" : null,
    options.endpoints
      ? "pnpm endpoints:generate   # when API schema is up"
      : null,
    "pnpm dev",
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
