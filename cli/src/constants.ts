import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** Resolved at runtime: dist/ → ../template, or src via tsx → ../template */
export const TEMPLATE_DIR = path.resolve(here, "../template");
/** Optional feature file packs copied by installers */
export const ADDONS_DIR = path.resolve(here, "../addons");

export const TITLE = "Next Style Guide";
export const PKG_NAME = "create-next-style-guide";
