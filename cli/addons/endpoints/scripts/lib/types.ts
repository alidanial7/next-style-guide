export type JsonSchema = {
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

export type OpenAPI = {
  openapi?: string;
  paths?: Record<string, Record<string, Operation>>;
  components?: { schemas?: Record<string, JsonSchema> };
};

export type Operation = {
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

export type Parameter = {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required?: boolean;
  description?: string;
  default?: unknown;
  schema?: JsonSchema;
  [key: string]: unknown;
};

export type CodegenConfig = {
  schemaUrl: string;
  basePath: string;
  outDir: string;
  preserve: string[];
  header: string;
};

export type EndpointSpec = {
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

export type Manifest = {
  schemaUrl: string;
  files: string[];
};
