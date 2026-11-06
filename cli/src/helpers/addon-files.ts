import fs from "fs-extra";
import path from "node:path";

import { ADDONS_DIR } from "../constants.js";

/** Read a file under `cli/addons/` and apply `__KEY__` replacements. */
export async function readAddonText(
  relativePath: string,
  vars: Record<string, string> = {},
): Promise<string> {
  let text = await fs.readFile(path.join(ADDONS_DIR, relativePath), "utf8");
  for (const [key, value] of Object.entries(vars)) {
    text = text.replaceAll(`__${key}__`, value);
  }
  return text;
}

/** Copy an addon file into the scaffolded project (optional vars for text files). */
export async function copyAddonFile(
  relativeFrom: string,
  absoluteTo: string,
  vars?: Record<string, string>,
): Promise<void> {
  if (vars && Object.keys(vars).length > 0) {
    const text = await readAddonText(relativeFrom, vars);
    await fs.outputFile(absoluteTo, text);
    return;
  }
  await fs.copy(path.join(ADDONS_DIR, relativeFrom), absoluteTo);
}
