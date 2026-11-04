import * as p from "@clack/prompts";
import color from "picocolors";
import path from "node:path";

import { PKG_NAME, TITLE } from "./constants.js";
import { slugify } from "./helpers/slugify.js";
import { runPrompts } from "./prompts.js";
import { scaffold } from "./scaffold.js";
import {
  DEFAULT_OPTIONS,
  type IconOption,
  type ScaffoldOptions,
} from "./types.js";

const ICON_VALUES = new Set<IconOption>(["none", "lucide", "tabler"]);

function parseArgs(argv: string[]): {
  name?: string;
  noInstall: boolean;
  yes: boolean;
  icons?: IconOption;
  tanstackQuery?: boolean;
  endpoints?: boolean;
  husky?: boolean;
} {
  const args = argv.slice(2);
  let name: string | undefined;
  let noInstall = false;
  let yes = false;
  let icons: IconOption | undefined;
  let tanstackQuery: boolean | undefined;
  let endpoints: boolean | undefined;
  let husky: boolean | undefined;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--no-install") {
      noInstall = true;
      continue;
    }
    if (arg === "--yes" || arg === "-y") {
      yes = true;
      continue;
    }
    if (arg === "--tanstack-query") {
      tanstackQuery = true;
      continue;
    }
    if (arg === "--no-tanstack-query") {
      tanstackQuery = false;
      continue;
    }
    if (arg === "--endpoints") {
      endpoints = true;
      continue;
    }
    if (arg === "--no-endpoints") {
      endpoints = false;
      continue;
    }
    if (arg === "--husky") {
      husky = true;
      continue;
    }
    if (arg === "--no-husky") {
      husky = false;
      continue;
    }
    if (arg.startsWith("--icons=")) {
      const value = arg.slice("--icons=".length) as IconOption;
      if (!ICON_VALUES.has(value)) {
        throw new Error(
          `Invalid --icons=${value}. Use none | lucide | tabler.`,
        );
      }
      icons = value;
      continue;
    }
    if (arg === "--icons") {
      const value = args[i + 1] as IconOption | undefined;
      if (!value || !ICON_VALUES.has(value)) {
        throw new Error(`Invalid --icons. Use none | lucide | tabler.`);
      }
      icons = value;
      i += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (!arg.startsWith("-") && !name) {
      name = arg;
    }
  }

  return { name, noInstall, yes, icons, tanstackQuery, endpoints, husky };
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
  --icons <name>         none | lucide | tabler
  --tanstack-query       Enable TanStack Query
  --no-tanstack-query    Disable TanStack Query
  --endpoints            Enable OpenAPI endpoints codegen
  --no-endpoints         Disable endpoints codegen
  --husky                Enable Husky + lint-staged
  --no-husky             Disable Husky
  --help, -h             Show help
`);
}

function applyFlagOverrides(
  options: ScaffoldOptions,
  flags: {
    icons?: IconOption;
    tanstackQuery?: boolean;
    endpoints?: boolean;
    husky?: boolean;
  },
): ScaffoldOptions {
  const next = { ...options };
  if (flags.icons !== undefined) next.icons = flags.icons;
  if (flags.tanstackQuery !== undefined) {
    next.data = flags.tanstackQuery ? "tanstack-query" : "rsc";
  }
  if (flags.endpoints !== undefined) next.endpoints = flags.endpoints;
  if (flags.husky !== undefined) next.husky = flags.husky;
  return next;
}

async function main(): Promise<void> {
  const {
    name: argName,
    noInstall,
    yes,
    icons,
    tanstackQuery,
    endpoints,
    husky,
  } = parseArgs(process.argv);

  let options: ScaffoldOptions;

  if (yes) {
    const name = (argName ?? "my-app").trim();
    options = applyFlagOverrides(
      {
        name,
        slug: slugify(name),
        ...DEFAULT_OPTIONS,
        noInstall,
      },
      { icons, tanstackQuery, endpoints, husky },
    );
    p.intro(color.bgCyan(color.black(` ${TITLE} `)));
    p.log.info(
      `Non-interactive: ${options.name} (${options.slug}) · icons=${options.icons} · data=${options.data} · endpoints=${options.endpoints} · husky=${options.husky}`,
    );
  } else {
    options = await runPrompts(argName);
    options.noInstall = noInstall;
    options = applyFlagOverrides(options, {
      icons,
      tanstackQuery,
      endpoints,
      husky,
    });
  }

  const projectDir = await scaffold(options);

  const nextSteps = [
    `cd ${path.relative(process.cwd(), projectDir) || "."}`,
    options.noInstall ? "pnpm install" : null,
    options.endpoints ? "pnpm endpoints:generate   # when API schema is up" : null,
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
