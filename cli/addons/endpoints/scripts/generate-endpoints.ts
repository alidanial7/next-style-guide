/**
 * Generate / sync `src/endpoints/*` from an OpenAPI (Swagger) schema URL.
 *
 * Usage:
 *   pnpm endpoints:generate
 *   pnpm endpoints:generate --url=http://localhost:8000/api/docs/schema/?format=json
 */

import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  const?: unknown;
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  nullable?: boolean;
  description?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  additionalProperties?: boolean | JsonSchema;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  $ref?: string;
  [key: string]: unknown;
};

type OpenAPI = {
  openapi?: string;
  paths?: Record<string, Record<string, Operation>>;
  components?: { schemas?: Record<string, JsonSchema> };
};

type Operation = {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: JsonSchema }>;
  };
  responses?: Record<string, { content?: Record<string, { schema?: JsonSchema }> }>;
};

type Parameter = {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required?: boolean;
  description?: string;
  default?: unknown;
  schema?: JsonSchema;
  [key: string]: unknown;
};

type CodegenConfig = {
  schemaUrl: string;
  basePath: string;
  outDir: string;
  preserve: string[];
  header: string;
};

type EndpointSpec = {
  method: string;
  openApiPath: string;
  relativePath: string;
  pathTemplate: string;
  resourceRoot: string;
  folderSegments: string[];
  name: string;
  schemaName: string;
  summary?: string;
  pathParams: Parameter[];
  queryParams: Parameter[];
  bodySchema: JsonSchema | null;
  bodyRequired: boolean;
  resultSchema: JsonSchema | null;
  isMultipart: boolean;
  hasEnvelope: boolean;
  hasDefaultParams?: boolean;
};

type Manifest = {
  schemaUrl: string;
  files: string[];
};

/* -------------------------------------------------------------------------- */
/*                                   Paths                                    */
/* -------------------------------------------------------------------------- */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(__dirname, "endpoints.codegen.json");
const MANIFEST_NAME = ".generated-manifest.json";

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);

/* -------------------------------------------------------------------------- */
/*                                    CLI                                     */
/* -------------------------------------------------------------------------- */

async function main() {
  const config = await loadConfig();
  const urlArg = process.argv.find((arg) => arg.startsWith("--url="));
  if (urlArg) {
    config.schemaUrl = urlArg.slice("--url=".length);
  }

  console.log(`Fetching schema: ${config.schemaUrl}`);
  const openapi = await fetchSchema(config.schemaUrl);
  const specs = buildSpecs(openapi, config.basePath);
  console.log(`Found ${specs.length} operations`);

  const outDir = path.join(ROOT, config.outDir);
  const previous = await readManifest(outDir);
  const written = new Set<string>();

  // 1. Emit central enums file
  const enumsContent = emitEnumsFile(openapi, config.header);
  await writeFile(path.join(outDir, "enums.ts"), enumsContent, "utf8");
  written.add("enums.ts");

  const byResource = groupBy(specs, (spec) => spec.resourceRoot);

  for (const [resource, resourceSpecs] of Object.entries(byResource)) {
    if (config.preserve?.includes(resource)) {
      continue;
    }
    for (const spec of resourceSpecs) {
      for (const file of await writeEndpointFiles(outDir, spec, config.header, openapi)) {
        written.add(file);
      }
    }
    const indexRel = path.join(resource, "index.ts");
    await writeFile(
      path.join(outDir, indexRel),
      emitResourceIndex(resourceSpecs, config.header),
      "utf8",
    );
    written.add(indexRel.replaceAll("\\", "/"));
  }

  // 2. Emit root index.ts re-exporting enums, Types, and all resources
  const allResources = await collectAllResources(outDir);
  const rootIndexContent = emitRootIndex(allResources, config.header);
  await writeFile(path.join(outDir, "index.ts"), rootIndexContent, "utf8");
  written.add("index.ts");

  const manifest: Manifest = {
    schemaUrl: config.schemaUrl,
    files: [...written].sort(),
  };
  await writeFile(
    path.join(outDir, MANIFEST_NAME),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  written.add(MANIFEST_NAME);

  const removed = await removeStaleGeneratedFiles(outDir, previous, written, config.preserve);
  await pruneEmptyDirs(outDir, config.preserve);

  console.log(`Wrote ${written.size} files`);
  if (removed.length) {
    console.log(`Removed ${removed.length} stale generated files`);
  }

  formatGeneratedWithPrettier(outDir, [...written]);
  console.log("Done.");
}

function toEnumConstName(typeName: string): string {
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

function emitEnumsFile(openapi: OpenAPI, header: string): string {
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

async function collectAllResources(outDir: string): Promise<string[]> {
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

function emitRootIndex(resources: string[], header: string): string {
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

async function loadConfig(): Promise<CodegenConfig> {
  const raw = await readFile(CONFIG_PATH, "utf8");
  return JSON.parse(raw) as CodegenConfig;
}

async function fetchSchema(url: string): Promise<OpenAPI> {
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

/* -------------------------------------------------------------------------- */
/*                              Spec building                                 */
/* -------------------------------------------------------------------------- */

function buildSpecs(openapi: OpenAPI, basePath: string): EndpointSpec[] {
  const specs: EndpointSpec[] = [];
  const normalizedBase = trimSlashes(basePath);

  for (const [rawPath, pathItem] of Object.entries(openapi.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) {
        continue;
      }
      if (!operation || typeof operation !== "object") {
        continue;
      }

      const openApiPath = rawPath;
      let relative = openApiPath;
      if (normalizedBase && relative.startsWith(`/${normalizedBase}`)) {
        relative = relative.slice(normalizedBase.length + 1);
      } else if (normalizedBase && relative.startsWith(normalizedBase)) {
        relative = relative.slice(normalizedBase.length);
      }
      relative = `/${trimSlashes(relative)}/`.replace(/\/+/g, "/");
      if (relative === "//") {
        relative = "/";
      }

      const segments = trimSlashes(relative)
        .split("/")
        .filter(Boolean)
        .map((segment) => (segment.startsWith("{") ? `{${stripBraces(segment)}}` : segment));

      if (segments.length === 0) {
        continue;
      }

      const resourceRoot = pascalCase(stripBraces(segments[0]!));
      const folderSegments = [
        ...segments.slice(1).map((segment) => {
          if (segment.startsWith("{")) {
            return `{${stripBraces(segment)}}`;
          }
          return segment;
        }),
        method[0]!.toUpperCase() + method.slice(1).toLowerCase(),
      ];
      const name = buildOperationName(method, segments);
      const schemaName = camelCase(name);

      const parameters = operation.parameters ?? [];
      const pathParams = parameters.filter((parameter) => parameter.in === "path");
      const queryParams = parameters.filter((parameter) => parameter.in === "query");

      const jsonContent = operation.requestBody?.content?.["application/json"];
      const multipartContent = operation.requestBody?.content?.["multipart/form-data"];
      const formContent = operation.requestBody?.content?.["application/x-www-form-urlencoded"];
      const bodyContent = multipartContent ?? jsonContent ?? formContent;
      const bodySchema = bodyContent?.schema ?? null;
      const resolvedForBinary = bodySchema
        ? createResolver(openapi.components?.schemas ?? {})(bodySchema)
        : null;
      // Prefer multipart when advertised, or when body has upload fields (logo/avatar)
      // even if OpenAPI only lists application/json (common DRF ImageField quirk).
      const isMultipart = Boolean(
        (multipartContent && (!jsonContent || schemaHasBinary(resolvedForBinary))) ||
        (!multipartContent && resolvedForBinary && schemaHasUploadField(resolvedForBinary)),
      );

      const success =
        operation.responses?.["200"] ??
        operation.responses?.["201"] ??
        operation.responses?.["204"];
      const responseSchema =
        success?.content?.["application/json"]?.schema ??
        success?.content?.["application/vnd.oai.openapi+json"]?.schema ??
        null;

      const { resultSchema, hasEnvelope } = unwrapEnvelope(responseSchema);

      const resolve = createResolver(openapi.components?.schemas ?? {});
      const hasDefaultParams = queryParams.some(
        (p) => getParamDefaultValue(p, resolve) !== undefined,
      );

      specs.push({
        method: method.toLowerCase(),
        openApiPath,
        relativePath: relative,
        pathTemplate: toAxiosPath(relative),
        resourceRoot,
        folderSegments,
        name,
        schemaName,
        summary: operation.summary,
        pathParams,
        queryParams,
        bodySchema,
        bodyRequired: Boolean(operation.requestBody?.required),
        resultSchema,
        isMultipart,
        hasEnvelope,
        hasDefaultParams,
      });
    }
  }

  return specs.sort((a, b) => a.name.localeCompare(b.name));
}

function buildOperationName(method: string, segments: string[]): string {
  const methodPart = method[0]!.toUpperCase() + method.slice(1).toLowerCase();
  const parts = segments.map((segment) => {
    if (segment.startsWith("{")) {
      return pascalCase(stripBraces(segment));
    }
    return pascalCase(segment);
  });
  return `${methodPart}${parts.join("")}`;
}

function unwrapEnvelope(schema: JsonSchema | null): {
  resultSchema: JsonSchema | null;
  hasEnvelope: boolean;
} {
  if (!schema) {
    return { resultSchema: null, hasEnvelope: false };
  }
  if (schema.$ref) {
    // Keep ref; resolved later. Detect envelope by name heuristic after resolve in emitter.
    return { resultSchema: schema, hasEnvelope: false };
  }
  if (
    schema.type === "object" &&
    schema.properties?.result &&
    schema.properties.success &&
    schema.properties.status
  ) {
    return { resultSchema: schema.properties.result, hasEnvelope: true };
  }
  return { resultSchema: schema, hasEnvelope: false };
}

function toAxiosPath(relative: string): string {
  // `/users/{id}/` → `/users/${request.path.id}/`
  return relative.replace(/\{([^}]+)\}/g, (_, name: string) => `\${request.path.${name}}`);
}

/* -------------------------------------------------------------------------- */
/*                                 Emit files                                 */
/* -------------------------------------------------------------------------- */

async function writeEndpointFiles(
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

  // Detect envelope after resolve
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
    // Keep trailing slash before query: `/clinics/?limit=8` (not `/clinics?limit=8/`).
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

function emitResourceIndex(specs: EndpointSpec[], header: string): string {
  const lines = [header, ``];
  // Match `simple-import-sort/exports`: sort by module path (not operation name).
  // Path params like `{clinic_id}` sort as `clinic_id` (punctuation ignored by Collator).
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

/** Same path normalization + collator as `eslint-plugin-simple-import-sort`. */
const importExportCollator = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
});

function compareStrings(a: string, b: string): number {
  return importExportCollator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
}

function compareImportExportSources(a: string, b: string): number {
  const normalizedA = normalizeImportExportSource(a);
  const normalizedB = normalizeImportExportSource(b);
  return compareStrings(normalizedA, normalizedB) || compareStrings(a, b);
}

function normalizeImportExportSource(source: string): string {
  return source
    .replace(/^[./]*\.$/, "$&/")
    .replace(/^[./]*\/$/, "$&,")
    .replace(/[./_-]/g, (char) => {
      switch (char) {
        case ".":
          return "_";
        case "/":
          return "-";
        case "_":
          return ".";
        case "-":
          return "/";
        default:
          return char;
      }
    });
}

function emitTypeImport(names: string[], from: string): string {
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  if (sorted.length === 1) {
    return `import type { ${sorted[0]} } from "${from}";`;
  }
  return [`import type {`, ...sorted.map((name) => `  ${name},`), `} from "${from}";`].join("\n");
}

function formatGeneratedWithPrettier(outDir: string, relFiles: string[]) {
  if (relFiles.length === 0) {
    return;
  }

  try {
    console.log("Formatting generated files with Prettier…");
    execFileSync("pnpm", ["exec", "prettier", "--write", outDir], {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch {
    console.log("Prettier not available — skipping format.");
  }

  try {
    console.log("Linting & sorting generated files with ESLint…");
    execFileSync("pnpm", ["exec", "eslint", "--fix", outDir], {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch {
    // ignore
  }
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

/* -------------------------------------------------------------------------- */
/*                          Schema → Zod / TS types                           */
/* -------------------------------------------------------------------------- */

function schemaHasBinary(schema: JsonSchema | null): boolean {
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
function isUploadField(key: string, schema: JsonSchema): boolean {
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

function schemaHasUploadField(schema: JsonSchema | null): boolean {
  return schemaHasBinary(schema);
}

function createResolver(schemas: Record<string, JsonSchema>) {
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
    { _enumType?: string } | undefined;
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

function emitTsType(
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

/* -------------------------------------------------------------------------- */
/*                              Filesystem sync                               */
/* -------------------------------------------------------------------------- */

async function readManifest(outDir: string): Promise<Manifest | null> {
  try {
    const raw = await readFile(path.join(outDir, MANIFEST_NAME), "utf8");
    return JSON.parse(raw) as Manifest;
  } catch {
    return null;
  }
}

async function removeStaleGeneratedFiles(
  outDir: string,
  previous: Manifest | null,
  nextFiles: Set<string>,
  preserve: string[],
): Promise<string[]> {
  const removed: string[] = [];
  const preserveSet = new Set(preserve);

  // Always remove previous manifest entries that disappeared
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

  // Remove mistaken nested layouts from earlier generator bugs / pre-codegen paths
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

async function pruneEmptyDirs(outDir: string, preserve: string[]) {
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

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const group = key(item);
    (result[group] ??= []).push(item);
  }
  return result;
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

function stripBraces(value: string) {
  return value.replace(/^\{|\}$/g, "");
}

function pascalCase(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join("");
}

function camelCase(value: string) {
  const pascal = pascalCase(value);
  return pascal ? pascal[0]!.toLowerCase() + pascal.slice(1) : pascal;
}

function safeKey(key: string) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : JSON.stringify(key);
}

function escapeComment(value: string) {
  return value.replace(/\*\//g, "*\\/").replace(/\n/g, " ");
}

function getParamDefaultValue(
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

function formatParamJsDoc(description?: string, defaultValue?: unknown, format?: string): string[] {
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
