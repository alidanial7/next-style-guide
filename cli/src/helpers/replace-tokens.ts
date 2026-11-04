import fs from "fs-extra";
import path from "node:path";

const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".mdc",
  ".css",
  ".scss",
  ".html",
  ".svg",
  ".yml",
  ".yaml",
  ".toml",
  ".env",
  ".example",
  ".gitignore",
  ".npmrc",
]);

export type TokenMap = Record<string, string>;

function shouldRewrite(filePath: string): boolean {
  const base = path.basename(filePath);
  if (base === ".env.example" || base === "LICENSE") return true;
  const ext = path.extname(filePath);
  return TEXT_EXT.has(ext) || base.startsWith(".");
}

function applyTokens(contents: string, tokens: TokenMap): string {
  let out = contents;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.split(key).join(value);
  }
  return out;
}

/** Walk project dir and replace `__TOKEN__` placeholders in text files. */
export async function replaceTokensInTree(
  root: string,
  tokens: TokenMap,
): Promise<void> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      await replaceTokensInTree(full, tokens);
      continue;
    }
    if (!shouldRewrite(full)) continue;
    const raw = await fs.readFile(full, "utf8");
    const next = applyTokens(raw, tokens);
    if (next !== raw) {
      await fs.writeFile(full, next, "utf8");
    }
  }
}
