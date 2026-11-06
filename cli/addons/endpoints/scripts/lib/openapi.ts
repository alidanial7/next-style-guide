import { readFile } from "node:fs/promises";

import { CONFIG_PATH } from "./paths.ts";
import type { CodegenConfig, OpenAPI } from "./types.ts";

export async function loadConfig(): Promise<CodegenConfig> {
  const raw = await readFile(CONFIG_PATH, "utf8");
  return JSON.parse(raw) as CodegenConfig;
}

export async function fetchSchema(url: string): Promise<OpenAPI> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (contentType.includes("json") || text.trimStart().startsWith("{")) {
    return JSON.parse(text) as OpenAPI;
  }
  throw new Error(
    "Schema is not JSON. Pass `?format=json` (drf-spectacular) or an Accept: application/json URL.",
  );
}
