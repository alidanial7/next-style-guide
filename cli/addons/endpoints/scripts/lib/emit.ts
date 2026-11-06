import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  compareImportExportSources,
  compareStrings,
  emitTypeImport,
} from "./import-sort";
import { escapeComment, safeKey } from "./helpers";
import { getParamDefaultValue, formatParamJsDoc } from "./param-helpers";
import { createResolver, emitTsType } from "./schema";
import type { EndpointSpec, OpenAPI } from "./types";

export function toEnumConstName(typeName: string): string {
  const snake = typeName
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toUpperCase();

  if (snake.endsWith("_BY")) {
    return `${snake}S`;
  }
  if (snake.endsWith("STATUS")) {
    return `${snake}ES`;
  }
  if (snake.endsWith("CATEGORY") || snake.endsWith("ENTITY")) {
    return `${snake.slice(0, -1)}IES`;
  }
  if (snake.endsWith("DAY")) {
    return `${snake}S`;
  }
  if (
    snake.endsWith("S") ||
    snake.endsWith("X") ||
    snake.endsWith("Z") ||
    snake.endsWith("CH") ||
    snake.endsWith("SH")
  ) {
    return `${snake}ES`;
  }
  if (snake.endsWith("Y") && !/[AEIOU]Y$/.test(snake)) {
    return `${snake.slice(0, -1)}IES`;
  }
  return `${snake}S`;
}

export function emitEnumsFile(openapi: OpenAPI, header: string): string {
  const schemas = openapi.components?.schemas ?? {};
  const enumEntries = Object.entries(schemas)
    .filter(([key, schema]) => key.endsWith("Enum") && Array.isArray(schema.enum))
    .sort(([a], [b]) => a.localeCompare(b));

  const lines: string[] = [header, ""];

  if (enumEntries.length === 0) {
    lines.push("export {};", "");
  }

  for (const [key, schema] of enumEntries) {
    const typeName = key.slice(0, -"Enum".length);
    const constName = toEnumConstName(typeName);
    const values = (schema.enum as unknown[]).filter((v) => v !== null && v !== undefined);

    if (schema.description) {
      const trimmed = schema.description.trim();
      if (trimmed) {
        lines.push(`/**`);
        for (const line of trimmed.split("\n")) {
          lines.push(` * ${line.replace(/\*\//g, "*\\/")}`);
        }
        lines.push(` */`);
      }
    }

    const typeUnion = values.map((val) => JSON.stringify(val)).join(" | ");
    lines.push(`export type ${typeName} = ${typeUnion || "never"};`, ``);

    lines.push(`export const ${constName} = [`);
    for (const val of values) {
      lines.push(`  ${JSON.stringify(val)},`);
    }
    lines.push(`] as const;`, ``);
  }

  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

export async function collectAllResources(outDir: string): Promise<string[]> {
  const entries = await readdir(outDir, { withFileTypes: true });
  const resources: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      try {
        await readFile(path.join(outDir, entry.name, "index.ts"), "utf8");
        resources.push(entry.name);
      } catch {
        // no index.ts
      }
    }
  }
  return resources.sort();
}

export function emitRootIndex(resources: string[], header: string): string {
  const sources = ["./enums", "./Types", ...resources.map((res) => `./${res}`)].sort(
    (a, b) => compareImportExportSources(a, b) || compareStrings(a, b),
  );

  const lines = [header, ""];
  for (const src of sources) {
    lines.push(`export * from "${src}";`);
  }
  lines.push("");
  return lines.join("\n");
}

export async function writeEndpointFiles(
  outDir: string,
  spec: EndpointSpec,
  header: string,
  openapi: OpenAPI,
): Promise<string[]> {
  const dir = path.join(outDir, spec.resourceRoot, ...spec.folderSegments);
  await mkdir(dir, { recursive: true });

  const typeRel = path
    .join(spec.resourceRoot, ...spec.folderSegments, `${spec.name}.type.ts`)
    .replaceAll("\\", "/");
  const callRel = path
    .join(spec.resourceRoot, ...spec.folderSegments, `${spec.name}.ts`)
    .replaceAll("\\", "/");

  await writeFile(path.join(outDir, typeRel), emitTypeFile(spec, header, openapi), "utf8");
  await writeFile(path.join(outDir, callRel), emitCallFile(spec, header), "utf8");

  return [typeRel, callRel];
}

function emitTypeFile(spec: EndpointSpec, header: string, openapi: OpenAPI): string {
  const schemas = openapi.components?.schemas ?? {};
  const resolve = createResolver(schemas);

  const bodyResolved = spec.bodySchema ? resolve(spec.bodySchema) : null;
  const resultResolved = spec.resultSchema ? resolve(spec.resultSchema) : null;

  let resultSchema = resultResolved;
  let hasEnvelope = spec.hasEnvelope;
  if (
    resultSchema &&
    resultSchema.type === "object" &&
    resultSchema.properties?.result &&
    resultSchema.properties.success &&
    resultSchema.properties.status
  ) {
    resultSchema = resolve(resultSchema.properties.result);
    hasEnvelope = true;
  }

  const hasBody = Boolean(bodyResolved);
  const hasQuery = spec.queryParams.length > 0;
  const hasPath = spec.pathParams.length > 0 || spec.pathTemplate.includes("request.path.");

  const usedEnums = new Set<string>();

  const bodyTypeStr = hasBody ? emitTsType(bodyResolved!, 0, undefined, usedEnums) : "";
  const resultTypeStr = resultSchema ? emitTsType(resultSchema, 0, undefined, usedEnums) : "";

  const queryLines: string[] = [];
  const defaultEntries: [string, unknown][] = [];
  if (hasQuery) {
    for (const parameter of spec.queryParams) {
      const schema = parameter.schema ? resolve(parameter.schema) : { type: "string" };
      const defaultValue = getParamDefaultValue(parameter, resolve);
      const description =
        parameter.description ?? schema.description ?? parameter.schema?.description;
      const format = parameter.schema?.format ?? schema.format;

      if (defaultValue !== undefined) {
        defaultEntries.push([parameter.name, defaultValue]);
      }

      const jsDoc = formatParamJsDoc(description, defaultValue, format);
      if (jsDoc.length > 0) {
        queryLines.push(...jsDoc);
      }
      const optional = parameter.required ? "" : "?";
      queryLines.push(
        `  ${safeKey(parameter.name)}${optional}: ${emitTsType(schema, 1, undefined, usedEnums)};`,
      );
    }
  }

  const pathLines: string[] = [];
  if (hasPath) {
    const pathNames = extractPathNames(spec);
    for (const name of pathNames) {
      const parameter = spec.pathParams.find((item) => item.name === name);
      const schema = parameter?.schema ? resolve(parameter.schema) : { type: "string" };
      pathLines.push(`  ${name}: ${emitTsType(schema, 1, undefined, usedEnums)};`);
    }
  }

  const lines: string[] = [header, ""];

  if (usedEnums.size > 0) {
    lines.push(`import type { ${[...usedEnums].sort().join(", ")} } from "@/endpoints/enums";`);
  }
  const typeImports = new Set<string>(["ApiRequestData"]);
  if (hasEnvelope) {
    typeImports.add("ApiObjectResponse");
  }
  lines.push(`import type { ${[...typeImports].sort().join(", ")} } from "@/endpoints/Types";`, ``);

  if (spec.summary) {
    lines.push(`/** ${escapeComment(spec.summary)} */`);
  } else {
    lines.push(`/** \`${spec.method.toUpperCase()} ${spec.relativePath}\` */`);
  }

  if (hasBody) {
    lines.push(`export type ${spec.name}Body = ${bodyTypeStr};`, ``);
    if (!spec.name.endsWith("Request") && !spec.name.endsWith("Body")) {
      lines.push(
        `/** Alias of the API request body (use for assignability checks with form Zod). */`,
        `export type ${spec.name}Request = ${spec.name}Body;`,
        ``,
      );
    }
  }

  if (hasQuery) {
    lines.push(`export type ${spec.name}Params = {`);
    lines.push(...queryLines);
    lines.push(`};`, ``);

    if (defaultEntries.length > 0) {
      lines.push(`export const ${spec.name}DefaultParams: Partial<${spec.name}Params> = {`);
      for (const [key, val] of defaultEntries) {
        lines.push(`  ${safeKey(key)}: ${JSON.stringify(val)},`);
      }
      lines.push(`} as const;`, ``);
    }
  }

  if (hasPath) {
    lines.push(`export type ${spec.name}Path = {`);
    lines.push(...pathLines);
    lines.push(`};`, ``);
  }

  const paramsType = hasQuery ? `${spec.name}Params` : "undefined";
  const bodyType = hasBody ? `${spec.name}Body` : "undefined";
  const pathType = hasPath ? `${spec.name}Path` : "undefined";

  if (hasPath) {
    lines.push(`export type ${spec.name}Call = {`);
    lines.push(`  request: ApiRequestData<${paramsType}, ${bodyType}> & { path: ${pathType} };`);
    lines.push(`};`, ``);
  } else if (hasBody || hasQuery) {
    lines.push(`export type ${spec.name}Call = {`);
    lines.push(`  request: ApiRequestData<${paramsType}, ${bodyType}>;`);
    lines.push(`};`, ``);
  } else {
    lines.push(`export type ${spec.name}Call = {`);
    lines.push(`  request?: ApiRequestData;`);
    lines.push(`};`, ``);
  }

  if (resultSchema) {
    lines.push(`export type ${spec.name}Result = ${resultTypeStr};`, ``);
    if (hasEnvelope) {
      lines.push(`export type ${spec.name}Response = ApiObjectResponse<${spec.name}Result>;`, ``);
    } else {
      lines.push(`export type ${spec.name}Response = ${spec.name}Result;`, ``);
    }
  } else {
    lines.push(`export type ${spec.name}Response = void;`, ``);
  }

  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

function emitCallFile(spec: EndpointSpec, header: string): string {
  const hasBody = Boolean(spec.bodySchema);
  const hasQuery = spec.queryParams.length > 0;
  const hasResponse = Boolean(spec.resultSchema);
  const hasPath = spec.pathParams.length > 0 || spec.pathTemplate.includes("request.path.");

  const lines: string[] = [header, ``, `import { api } from "@/utils/axios-instance";`];

  if (spec.isMultipart) {
    lines.push(`import { toApiBody } from "@/utils/form-data";`);
  }

  if (hasQuery) {
    lines.push(`import { toSearchParams } from "@/utils/search-params";`);
  }

  const callTypeImports = [`${spec.name}Call`, `${spec.name}Response`];
  if (spec.method === "get") {
    if (hasQuery) {
      callTypeImports.push(`${spec.name}Params`);
    }
    if (hasPath) {
      callTypeImports.push(`${spec.name}Path`);
    }
  }

  lines.push(``, emitTypeImport(callTypeImports, `./${spec.name}.type`), ``);

  if (spec.summary) {
    lines.push(
      `/** ${escapeComment(spec.summary)} — \`${spec.method.toUpperCase()} ${spec.relativePath}\` */`,
    );
  } else {
    lines.push(`/** \`${spec.method.toUpperCase()} ${spec.relativePath}\` */`);
  }

  const usesRequest =
    hasBody || hasQuery || spec.pathTemplate.includes("request.path.") || spec.isMultipart;

  if (usesRequest) {
    lines.push(`export default async function ${spec.name}({`);
    lines.push(`  request,`);
    lines.push(`}: ${spec.name}Call): Promise<${spec.name}Response> {`);
  } else {
    lines.push(`export default async function ${spec.name}(`);
    lines.push(`  _call: ${spec.name}Call = {},`);
    lines.push(`): Promise<${spec.name}Response> {`);
  }

  let finalUrl: string;
  if (hasQuery) {
    const base = spec.pathTemplate.endsWith("/") ? spec.pathTemplate : `${spec.pathTemplate}/`;
    finalUrl = `\`${base}\${toSearchParams(request?.params)}\``;
  } else if (spec.pathTemplate.includes("request.path.")) {
    finalUrl = `\`${spec.pathTemplate}\``;
  } else {
    finalUrl = `"${spec.relativePath}"`;
  }

  const method = spec.method;
  const args: string[] = [finalUrl];
  if (spec.isMultipart) {
    lines.push(
      `  const payload = toApiBody(request?.body as Record<string, unknown> | undefined);`,
    );
    args.push("payload");
  } else if (hasBody && method !== "get" && method !== "delete" && method !== "head") {
    args.push("request?.body");
  }

  const isBinaryResponse = spec.resultSchema?.format === "binary";
  if (isBinaryResponse) {
    if (method === "get" || method === "delete" || method === "head") {
      args.push('{ responseType: "blob" }');
    } else {
      if (args.length === 1) {
        args.push("undefined");
      }
      args.push('{ responseType: "blob" }');
    }
  }

  if (hasResponse) {
    lines.push(`  const { data } = await api.${method}<${spec.name}Response>(${args.join(", ")});`);
    lines.push(`  return data;`);
  } else {
    lines.push(`  await api.${method}(${args.join(", ")});`);
  }

  lines.push(`}`);

  if (spec.method === "get") {
    lines.push(``, emitQueryKeyFunction(spec));
  }

  return `${lines.join("\n")}\n`;
}

function emitQueryKeyFunction(spec: EndpointSpec): string {
  const hasQuery = spec.queryParams.length > 0;
  const hasPath = spec.pathParams.length > 0 || spec.pathTemplate.includes("request.path.");
  const fnName = `get${spec.name}QueryKey`;

  if (!hasPath && !hasQuery) {
    return [
      `/** TanStack Query cache key factory for \`${spec.name}\`. */`,
      `export function ${fnName}() {`,
      `  return ["${spec.resourceRoot}", "${spec.relativePath}"] as const;`,
      `}`,
    ].join("\n");
  }

  if (!hasPath && hasQuery) {
    return [
      `/** TanStack Query cache key factory for \`${spec.name}\`. */`,
      `export function ${fnName}(`,
      `  args?: ${spec.name}Params | ${spec.name}Call | ${spec.name}Call["request"],`,
      `) {`,
      `  const request =`,
      `    args && typeof args === "object" && "request" in args ? args.request : args;`,
      `  const params =`,
      `    request && typeof request === "object" && "params" in request ? request.params : request;`,
      `  return ["${spec.resourceRoot}", "${spec.relativePath}", params] as const;`,
      `}`,
    ].join("\n");
  }

  const keyPathTemplate = spec.relativePath.replace(
    /\{([^}]+)\}/g,
    (_, name) => `\${path?.${name} ?? ":${name}"}`,
  );

  const queryTypeParam = hasQuery ? `params?: ${spec.name}Params;` : "";
  const argsType = [
    `${spec.name}Call`,
    `${spec.name}Call["request"]`,
    `{ path: ${spec.name}Path; ${queryTypeParam} }`,
  ].join(" | ");

  const lines = [
    `/** TanStack Query cache key factory for \`${spec.name}\`. */`,
    `export function ${fnName}(args?: ${argsType}) {`,
    `  const request =`,
    `    args && typeof args === "object" && "request" in args ? args.request : args;`,
    `  const path =`,
    `    request && typeof request === "object" && "path" in request ? request.path : undefined;`,
  ];

  if (hasQuery) {
    lines.push(
      `  const params =`,
      `    request && typeof request === "object" && "params" in request ? request.params : undefined;`,
      `  return ["${spec.resourceRoot}", \`${keyPathTemplate}\`, params] as const;`,
    );
  } else {
    lines.push(`  return ["${spec.resourceRoot}", \`${keyPathTemplate}\`] as const;`);
  }
  lines.push(`}`);

  return lines.join("\n");
}

export function emitResourceIndex(specs: EndpointSpec[], header: string): string {
  const lines = [header, ``];
  const sorted = [...specs].sort((a, b) => {
    const pathA = `./${a.folderSegments.join("/")}/${a.name}`;
    const pathB = `./${b.folderSegments.join("/")}/${b.name}`;
    return compareImportExportSources(pathA, pathB) || compareStrings(a.name, b.name);
  });

  for (const spec of sorted) {
    const relDir = `./${spec.folderSegments.join("/")}`;
    if (spec.method === "get") {
      lines.push(
        `export { get${spec.name}QueryKey, default as ${spec.name} } from "${relDir}/${spec.name}";`,
      );
    } else {
      lines.push(`export { default as ${spec.name} } from "${relDir}/${spec.name}";`);
    }

    const typeExports = [
      `${spec.name}Call`,
      `${spec.name}Response`,
      ...(spec.bodySchema ? [`${spec.name}Body`] : []),
      ...(spec.bodySchema && !spec.name.endsWith("Request") && !spec.name.endsWith("Body")
        ? [`${spec.name}Request`]
        : []),
      ...(spec.resultSchema ? [`${spec.name}Result`] : []),
      ...(spec.queryParams.length ? [`${spec.name}Params`] : []),
    ].sort(compareStrings);

    lines.push(`export type {`);
    for (const typeName of typeExports) {
      lines.push(`  ${typeName},`);
    }
    lines.push(`} from "${relDir}/${spec.name}.type";`);

    if (spec.hasDefaultParams) {
      lines.push(`export { ${spec.name}DefaultParams } from "${relDir}/${spec.name}.type";`);
    }
  }

  lines.push(``);
  return lines.join("\n");
}

function extractPathNames(spec: EndpointSpec): string[] {
  const fromTemplate = [...spec.pathTemplate.matchAll(/request\.path\.([A-Za-z0-9_]+)/g)].map(
    (match) => match[1]!,
  );
  if (fromTemplate.length) {
    return fromTemplate;
  }
  return spec.pathParams.map((parameter) => parameter.name);
}
