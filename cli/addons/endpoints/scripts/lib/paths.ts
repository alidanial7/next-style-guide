import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Directory containing `generate-endpoints.ts` and `endpoints.codegen.json`. */
export const SCRIPTS_DIR = path.join(__dirname, "..");

/** Project root (parent of `scripts/`). */
export const ROOT = path.resolve(SCRIPTS_DIR, "..");

export const CONFIG_PATH = path.join(SCRIPTS_DIR, "endpoints.codegen.json");
