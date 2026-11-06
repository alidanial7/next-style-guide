import { HTTP_METHODS } from "./constants";
import { camelCase, pascalCase, stripBraces, trimSlashes } from "./helpers";
import { getParamDefaultValue } from "./param-helpers";
import { createResolver, schemaHasBinary, schemaHasUploadField } from "./schema";
import type { EndpointSpec, JsonSchema, OpenAPI } from "./types";

export function buildSpecs(openapi: OpenAPI, basePath: string): EndpointSpec[] {
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
  return relative.replace(/\{([^}]+)\}/g, (_, name: string) => `\${request.path.${name}}`);
}
