import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

import { MANIFEST_NAME } from "./constants.ts";
import type { Manifest } from "./types.ts";

export async function readManifest(outDir: string): Promise<Manifest | null> {
  try {
    const raw = await readFile(path.join(outDir, MANIFEST_NAME), "utf8");
    return JSON.parse(raw) as Manifest;
  } catch {
    return null;
  }
}

export async function removeStaleGeneratedFiles(
  outDir: string,
  previous: Manifest | null,
  nextFiles: Set<string>,
  preserve: string[],
): Promise<string[]> {
  const removed: string[] = [];
  const preserveSet = new Set(preserve);

  for (const rel of previous?.files ?? []) {
    if (rel === MANIFEST_NAME) {
      continue;
    }
    if (nextFiles.has(rel)) {
      continue;
    }
    if (preserveSet.has(rel.split("/")[0]!)) {
      continue;
    }
    const full = path.join(outDir, rel);
    try {
      await rm(full, { force: true });
      removed.push(rel);
    } catch {
      // ignore
    }
  }

  const legacyGlobs = ["Auth/login/username", "Auth/auth", "Users/users", "Health/health"];
  for (const rel of legacyGlobs) {
    const full = path.join(outDir, rel);
    try {
      await rm(full, { recursive: true, force: true });
      removed.push(rel);
    } catch {
      // ignore
    }
  }
  return removed;
}

export async function pruneEmptyDirs(outDir: string, preserve: string[]) {
  const preserveSet = new Set(preserve);

  async function walk(dir: string): Promise<boolean> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return false;
    }

    let keep = false;
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(outDir, full).replaceAll("\\", "/");
      if (preserveSet.has(entry.name) || preserveSet.has(rel.split("/")[0]!)) {
        keep = true;
        continue;
      }
      if (entry.isDirectory()) {
        const childKeep = await walk(full);
        if (!childKeep) {
          await rm(full, { recursive: true, force: true });
        } else {
          keep = true;
        }
      } else {
        keep = true;
      }
    }
    return keep || dir === outDir;
  }

  await walk(outDir);
}
