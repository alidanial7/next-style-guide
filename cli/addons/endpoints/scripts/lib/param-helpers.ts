import type { JsonSchema, Parameter } from "./types";

export function getParamDefaultValue(
  parameter: Parameter,
  resolve?: (s: JsonSchema) => JsonSchema,
): unknown {
  if (parameter.default !== undefined) {
    return parameter.default;
  }
  if (parameter.schema?.default !== undefined) {
    return parameter.schema.default;
  }
  if (parameter.schema && resolve) {
    const resolved = resolve(parameter.schema);
    if (resolved?.default !== undefined) {
      return resolved.default;
    }
  }
  return undefined;
}

export function formatParamJsDoc(description?: string, defaultValue?: unknown, format?: string): string[] {
  const docLines: string[] = [];
  if (description) {
    const trimmed = description.trim();
    if (trimmed) {
      for (const line of trimmed.split("\n")) {
        docLines.push(` * ${line.replace(/\*\//g, "*\\/")}`);
      }
    }
  }
  if (format === "date") {
    docLines.push(` * @format YYYY-MM-DD`);
  } else if (format === "date-time") {
    docLines.push(` * @format ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)`);
  }
  if (defaultValue !== undefined) {
    docLines.push(` * @default ${JSON.stringify(defaultValue)}`);
  }
  if (docLines.length === 0) {
    return [];
  }
  return [`  /**`, ...docLines.map((l) => `  ${l}`), `   */`];
}
