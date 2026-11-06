import type { JsonSchema } from "./types.ts";

export function schemaHasBinary(schema: JsonSchema | null): boolean {
  if (!schema) {
    return false;
  }
  if (schema.format === "binary") {
    return true;
  }
  if (schema.properties) {
    return Object.entries(schema.properties).some(([key, value]) =>
      isUploadField(key, value) ? true : schemaHasBinary(value),
    );
  }
  if (schema.items) {
    return schemaHasBinary(schema.items);
  }
  if (schema.oneOf) {
    return schema.oneOf.some((value) => schemaHasBinary(value));
  }
  if (schema.allOf) {
    return schema.allOf.some((value) => schemaHasBinary(value));
  }
  return false;
}

/** ImageField-like props that OpenAPI often types as plain string (inputs only). */
export function isUploadField(key: string, schema: JsonSchema): boolean {
  if (schema.format === "uri") {
    return false;
  }
  if (schema.format === "binary") {
    return true;
  }
  if (key !== "logo" && key !== "avatar") {
    return false;
  }
  const description = (schema.description ?? "").toLowerCase();
  return (
    description.includes("image") ||
    description.includes("logo") ||
    description.includes("avatar") ||
    schema.type === "string" ||
    !schema.type
  );
}

export function schemaHasUploadField(schema: JsonSchema | null): boolean {
  return schemaHasBinary(schema);
}

export function createResolver(schemas: Record<string, JsonSchema>) {
  return function resolve(schema: JsonSchema, seen = new Set<string>()): JsonSchema {
    if (schema.$ref) {
      const name = schema.$ref.replace("#/components/schemas/", "");
      if (seen.has(name)) {
        return { type: "object", additionalProperties: true };
      }
      const target = schemas[name];
      if (!target) {
        return { type: "unknown" as unknown as string };
      }
      if (name.endsWith("Enum") && Array.isArray(target.enum)) {
        const enumTypeName = name.slice(0, -"Enum".length);
        return {
          ...target,
          _enumType: enumTypeName,
          nullable: Boolean(schema.nullable || target.nullable),
          description: schema.description ?? target.description,
        };
      }
      seen.add(name);
      return resolve(target, seen);
    }

    if (schema.allOf?.length) {
      const merged = mergeAllOf(schema.allOf.map((item) => resolve(item, seen)));
      return {
        ...merged,
        nullable: Boolean(schema.nullable || merged.nullable),
        readOnly: schema.readOnly ?? merged.readOnly,
        description: schema.description ?? merged.description,
      };
    }

    if (schema.oneOf?.length || schema.anyOf?.length) {
      const variants = (schema.oneOf ?? schema.anyOf ?? []).map((item) => resolve(item, seen));
      const withoutNull = variants.filter((item) => item.type !== "null" && item.const !== null);
      const hasNull = variants.some(
        (item) => item.type === "null" || item.nullable || item.const === null,
      );
      if (withoutNull.length === 1 && hasNull) {
        return { ...withoutNull[0]!, nullable: true };
      }
      if (withoutNull.length === 1) {
        return withoutNull[0]!;
      }
      return { oneOf: withoutNull, nullable: hasNull };
    }

    if (schema.properties) {
      const properties: Record<string, JsonSchema> = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        properties[key] = resolve(value, new Set(seen));
      }
      return { ...schema, properties };
    }

    if (schema.items) {
      return { ...schema, items: resolve(schema.items, new Set(seen)) };
    }

    return schema;
  };
}

function mergeAllOf(parts: JsonSchema[]): JsonSchema {
  if (parts.length === 1) {
    return parts[0]!;
  }

  const enumType = parts.find((part) => (part as { _enumType?: string })._enumType) as
    | { _enumType?: string }
    | undefined;
  const format = parts.find((part) => part.format)?.format;

  const objectParts = parts.filter(
    (part) => part.properties && Object.keys(part.properties).length > 0,
  );

  if (objectParts.length === 0) {
    const base =
      [...parts].reverse().find((part) => part.enum || part.type || part.oneOf) ?? parts[0]!;
    return {
      ...base,
      _enumType: enumType?._enumType,
      format: format ?? base.format,
      nullable: parts.some((part) => part.nullable) || base.nullable,
      description: parts.find((part) => part.description)?.description ?? base.description,
    };
  }

  const properties: Record<string, JsonSchema> = {};
  const required = new Set<string>();
  let nullable = false;

  for (const part of objectParts) {
    if (part.nullable) {
      nullable = true;
    }
    if (part.properties) {
      Object.assign(properties, part.properties);
    }
    for (const key of part.required ?? []) {
      required.add(key);
    }
  }

  return {
    type: "object",
    properties,
    required: [...required],
    nullable,
    _enumType: enumType?._enumType,
    format,
  };
}

function formatPropJsDoc(schema: JsonSchema, pad: string): string[] {
  const docLines: string[] = [];
  if (schema.description) {
    const trimmed = schema.description.trim();
    if (trimmed) {
      for (const line of trimmed.split("\n")) {
        docLines.push(` * ${line.replace(/\*\//g, "*\\/")}`);
      }
    }
  }
  if (schema.format === "date") {
    docLines.push(` * @format YYYY-MM-DD`);
  } else if (schema.format === "date-time") {
    docLines.push(` * @format ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)`);
  }
  if (schema.default !== undefined) {
    docLines.push(` * @default ${JSON.stringify(schema.default)}`);
  }
  if (docLines.length === 0) {
    return [];
  }
  return [`${pad}/**`, ...docLines.map((l) => `${pad}${l}`), `${pad} */`];
}

export function emitTsType(
  schema: JsonSchema,
  depth: number,
  propertyKey?: string,
  usedEnums?: Set<string>,
): string {
  if ((schema as { _enumType?: string })._enumType) {
    const enumType = (schema as { _enumType: string })._enumType;
    usedEnums?.add(enumType);
    return schema.nullable ? `${enumType} | null` : enumType;
  }

  if (schema.oneOf?.length) {
    const parts = [
      ...new Set(schema.oneOf.map((item) => emitTsType(item, depth, undefined, usedEnums))),
    ];
    const union = parts.join(" | ");
    return schema.nullable ? `${union} | null` : union;
  }

  if (schema.enum) {
    const union = schema.enum.map((value) => JSON.stringify(value)).join(" | ");
    return schema.nullable ? `${union} | null` : union;
  }

  if (propertyKey && isUploadField(propertyKey, schema)) {
    return schema.nullable ? "File | null" : "File";
  }

  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  const nullable = schema.nullable || types.includes("null");
  const primary = types.find((type) => type !== "null") ?? inferType(schema);

  let expr: string;
  switch (primary) {
    case "string":
      expr = schema.format === "binary" ? "Blob" : "string";
      break;
    case "integer":
    case "number":
      expr = "number";
      break;
    case "boolean":
      expr = "boolean";
      break;
    case "array":
      expr = `Array<${schema.items ? emitTsType(schema.items, depth, undefined, usedEnums) : "unknown"}>`;
      break;
    case "object":
    default: {
      if (!schema.properties) {
        expr = "Record<string, unknown>";
        break;
      }
      const required = new Set(schema.required ?? []);
      const pad = "  ".repeat(depth + 1);
      const close = "  ".repeat(depth);
      const entries = Object.entries(schema.properties).map(([key, value]) => {
        const optional = required.has(key) ? "" : "?";
        const doc = formatPropJsDoc(value, pad);
        const fieldLine = `${pad}${safeKey(key)}${optional}: ${emitTsType(value, depth + 1, key, usedEnums)};`;
        return doc.length > 0 ? `${doc.join("\n")}\n${fieldLine}` : fieldLine;
      });
      expr = `{\n${entries.join("\n")}\n${close}}`;
      break;
    }
  }

  return nullable ? `${expr} | null` : expr;
}

function inferType(schema: JsonSchema): string {
  if (schema.properties) {
    return "object";
  }
  if (schema.items) {
    return "array";
  }
  if (schema.format === "binary") {
    return "string";
  }
  return "unknown";
}

function safeKey(key: string) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : JSON.stringify(key);
}
