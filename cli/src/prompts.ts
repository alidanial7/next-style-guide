import * as p from "@clack/prompts";
import color from "picocolors";

import { TITLE } from "./constants.js";
import { slugify } from "./helpers/slugify.js";
import {
  DEFAULT_OPTIONS,
  type IconOption,
  type ScaffoldOptions,
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

  const icons = assertNotCancel(
    await p.select({
      message: "Icon library?",
      options: [
        {
          value: "none" satisfies IconOption,
          label: "None",
          hint: "add later",
        },
        {
          value: "lucide" satisfies IconOption,
          label: "Lucide",
          hint: "lucide-react — common with shadcn",
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

  const husky = assertNotCancel(
    await p.confirm({
      message: "Add Husky + lint-staged (pre-commit)?",
      initialValue: DEFAULT_OPTIONS.husky,
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

  return {
    name: name.trim(),
    slug,
    ...DEFAULT_OPTIONS,
    icons,
    data: useTanstackQuery ? "tanstack-query" : "rsc",
    endpoints,
    husky,
  };
}
