import path from "node:path";

import type { ScaffoldOptions } from "../types.js";

/** App Router segment that holds pages/layouts (`[locale]` when i18n is on). */
export function appPagesDir(
  projectDir: string,
  options: Pick<ScaffoldOptions, "i18n">,
): string {
  const appDir = path.join(projectDir, "src", "app");
  return options.i18n ? path.join(appDir, "[locale]") : appDir;
}
