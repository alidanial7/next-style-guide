import fs from "fs-extra";
import path from "node:path";

import { slugify } from "./slugify.js";

/** create-next-app-style allowlist — scaffold into cwd that only has these. */
const IGNORABLE_ENTRIES = new Set([
  ".DS_Store",
  ".git",
  ".gitattributes",
  ".gitignore",
  ".gitlab-ci.yml",
  ".hg",
  ".hgcheck",
  ".hgignore",
  ".idea",
  ".npmignore",
  ".travis.yml",
  ".vscode",
  "LICENSE",
  "LICENSE.md",
  "LICENSE.txt",
  "README.md",
  "Thumbs.db",
]);

export function isInPlaceTarget(target: string): boolean {
  const t = target.trim();
  return t === "." || t === "./";
}

export type ProjectTarget = {
  /** Absolute output directory */
  outDir: string;
  /** Display / token name (folder basename when target is ".") */
  name: string;
  slug: string;
  inPlace: boolean;
};

export function resolveProjectTarget(
  target: string,
  cwd: string = process.cwd(),
): ProjectTarget {
  const trimmed = target.trim();
  if (!trimmed) {
    throw new Error("Project name is required.");
  }

  const inPlace = isInPlaceTarget(trimmed);
  const outDir = path.resolve(cwd, inPlace ? "." : trimmed);
  const base = path.basename(outDir);
  const name =
    inPlace && (!base || base === "." || base === path.sep)
      ? "app"
      : inPlace
        ? base
        : trimmed;

  return {
    outDir,
    name,
    slug: slugify(name),
    inPlace,
  };
}

/** True when dir is missing, empty, or only contains ignorable VCS/editor files. */
export async function assertDirScaffoldable(outDir: string): Promise<void> {
  if (!(await fs.pathExists(outDir))) return;

  const entries = await fs.readdir(outDir);
  const blockers = entries.filter((entry) => !IGNORABLE_ENTRIES.has(entry));
  if (blockers.length === 0) return;

  throw new Error(
    [
      `Target directory is not empty: ${outDir}`,
      `Conflicting entries: ${blockers.slice(0, 8).join(", ")}${blockers.length > 8 ? ", …" : ""}`,
      `Use an empty folder, or run with \`.\` only in a fresh directory (".git" / README / LICENSE are OK).`,
    ].join("\n"),
  );
}
