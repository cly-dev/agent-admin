export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type HttpMethodUpper = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OpenAPISchema {
  type?: string;
  $ref?: string;
  properties?: Record<string, OpenAPISchema>;
  additionalProperties?: OpenAPISchema | boolean;
}

export interface OpenAPIParameter {
  in?: string;
  name: string;
  schema?: OpenAPISchema;
}

export interface OpenAPIOperation {
  operationId?: string;
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    content?: Record<string, { schema?: OpenAPISchema }>;
  };
  responses?: Record<
    string,
    {
      content?: Record<string, { schema?: OpenAPISchema }>;
    }
  >;
}

export type OpenAPIPathItem = {
  parameters?: OpenAPIParameter[];
} & Partial<Record<HttpMethod, OpenAPIOperation>>;

export interface OpenAPISwagger {
  openapi?: string;
  info?: unknown;
  servers?: unknown;
  security?: unknown;
  tags?: unknown;
  paths?: Record<string, OpenAPIPathItem>;
  components?: Record<string, Record<string, unknown>>;
}

export interface OperationInfo {
  key: string;
  method: HttpMethodUpper;
  urlPath: string;
  operationId: string;
  tag: string;
  summary: string;
  op: OpenAPIOperation;
}

export interface ModulePlanItem {
  tag: string;
  slug: string;
  baseSlug: string;
}

export interface TagOperation {
  urlPath: string;
  method: string;
  op: OpenAPIOperation;
}
