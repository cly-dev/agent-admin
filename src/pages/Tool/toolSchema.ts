import type { ApiTestParamsByIn } from '@/components/ApiTestPanel';
import { createEmptyApiTestParams } from '@/components/ApiTestPanel';

/** OpenAPI 参数位置（与后端 inputSchema.parameters[].in 一致） */
export type ToolParameterIn = 'path' | 'query' | 'header' | 'body';

export type ToolParameterType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';

export type ToolParameter = {
  id: string;
  name: string;
  in: ToolParameterIn;
  type: ToolParameterType;
  format?: string;
  required: boolean;
  description: string;
};

/** 后端 inputSchema / schema 运行时结构 */
export type ToolOpenApiInputSchema = {
  parameters: Record<string, unknown>[];
  requestBody: unknown;
};

const PARAM_IN_VALUES: ToolParameterIn[] = ['path', 'query', 'header', 'body'];
const PARAM_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;

export function createEmptyParameter(): ToolParameter {
  return {
    id: `param_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    in: 'query',
    type: 'string',
    format: '',
    required: false,
    description: '',
  };
}

function normalizeParameterIn(value: unknown): ToolParameterIn {
  const raw = String(value ?? 'query').toLowerCase();
  if (PARAM_IN_VALUES.includes(raw as ToolParameterIn)) {
    return raw as ToolParameterIn;
  }
  return 'query';
}

function normalizeParameterType(value: unknown): ToolParameterType {
  const raw = String(value ?? 'string').toLowerCase();
  if (
    raw === 'string' ||
    raw === 'number' ||
    raw === 'integer' ||
    raw === 'boolean' ||
    raw === 'object' ||
    raw === 'array'
  ) {
    return raw;
  }
  return 'string';
}

function extractParametersArray(schema?: object): Record<string, unknown>[] {
  if (!schema || typeof schema !== 'object') {
    return [];
  }
  const root = schema as Record<string, unknown>;
  if (!Array.isArray(root.parameters)) {
    return [];
  }
  return root.parameters.filter(
    (item): item is Record<string, unknown> => typeof item === 'object' && item !== null,
  );
}

function parseOpenApiParameter(raw: Record<string, unknown>, index: number): ToolParameter | null {
  const name = String(raw.name ?? '').trim();
  if (!name) {
    return null;
  }

  const paramIn = normalizeParameterIn(raw.in);
  let type: ToolParameterType = 'string';
  let format = typeof raw.format === 'string' ? raw.format : '';

  if (paramIn === 'body' && typeof raw.schema === 'object' && raw.schema !== null) {
    const bodySchema = raw.schema as Record<string, unknown>;
    type = normalizeParameterType(bodySchema.type ?? 'object');
    if (!format && typeof bodySchema.format === 'string') {
      format = bodySchema.format;
    }
  } else {
    type = normalizeParameterType(raw.type);
  }

  return {
    id: `${paramIn}_${name}_${index}`,
    name,
    in: paramIn,
    type,
    format,
    required: Boolean(raw.required),
    description: typeof raw.description === 'string' ? raw.description : '',
  };
}

/** 兼容旧版 JSON Schema properties 结构 */
function parametersFromJsonSchemaProperties(schema?: object): ToolParameter[] {
  if (!schema || typeof schema !== 'object') {
    return [];
  }

  const root = schema as Record<string, unknown>;
  const properties =
    typeof root.properties === 'object' && root.properties !== null
      ? (root.properties as Record<string, unknown>)
      : undefined;

  if (!properties) {
    return [];
  }

  const requiredNames = Array.isArray(root.required)
    ? root.required.map((item) => String(item))
    : [];

  return Object.entries(properties).map(([name, definition], index) => {
    const def =
      typeof definition === 'object' && definition !== null
        ? (definition as Record<string, unknown>)
        : {};

    return {
      id: `legacy_${name}_${index}`,
      name,
      in: 'query' as ToolParameterIn,
      type: normalizeParameterType(def.type),
      format: typeof def.format === 'string' ? def.format : '',
      required: requiredNames.includes(name),
      description: typeof def.description === 'string' ? def.description : '',
    };
  });
}

/**
 * 解析工具参数：优先 inputSchema.parameters，其次 schema.parameters，最后回退 JSON Schema properties
 */
export function parametersFromToolSchemas(inputSchema?: object, schema?: object): ToolParameter[] {
  const fromInput = extractParametersArray(inputSchema)
    .map((item, index) => parseOpenApiParameter(item, index))
    .filter((item): item is ToolParameter => item !== null);
  if (fromInput.length > 0) {
    return fromInput;
  }

  const fromSchema = extractParametersArray(schema)
    .map((item, index) => parseOpenApiParameter(item, index))
    .filter((item): item is ToolParameter => item !== null);
  if (fromSchema.length > 0) {
    return fromSchema;
  }

  const legacyInput = parametersFromJsonSchemaProperties(inputSchema);
  if (legacyInput.length > 0) {
    return legacyInput;
  }

  return parametersFromJsonSchemaProperties(schema);
}

/** @deprecated 使用 parametersFromToolSchemas */
export function parametersFromSchema(schema?: object): ToolParameter[] {
  return parametersFromToolSchemas(schema, undefined);
}

function buildOpenApiParameterDefinition(param: ToolParameter): Record<string, unknown> {
  const name = param.name.trim();
  const description = param.description.trim();
  const format = param.format?.trim();

  const definition: Record<string, unknown> = {
    in: param.in,
    name,
    required: param.required,
  };

  if (description) {
    definition.description = description;
  }

  if (param.in === 'body') {
    const bodySchema: Record<string, unknown> = { type: param.type };
    if (format) {
      bodySchema.format = format;
    }
    definition.schema = bodySchema;
    return definition;
  }

  definition.type = param.type;
  if (format) {
    definition.format = format;
  }

  return definition;
}

/** 构建运行时 inputSchema（LLM + HTTP 拆参） */
export function buildInputSchemaFromParameters(parameters: ToolParameter[]): ToolOpenApiInputSchema {
  const items = parameters
    .map((param) => buildOpenApiParameterDefinition(param))
    .filter((param) => String(param.name ?? '').trim().length > 0);

  return {
    parameters: items,
    requestBody: null,
  };
}

/** schema 作为与 inputSchema 同结构的备用字段 */
export function buildSchemaFromParameters(parameters: ToolParameter[]): ToolOpenApiInputSchema {
  return buildInputSchemaFromParameters(parameters);
}

function sampleValueForType(type: ToolParameterType, required: boolean): unknown {
  switch (type) {
    case 'integer':
    case 'number':
      return 1;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return required ? 'example' : '';
  }
}

function stringifySampleValue(param: ToolParameter): string {
  const sample = sampleValueForType(param.type, param.required);
  if (param.in === 'body' && (param.type === 'object' || param.type === 'array')) {
    return JSON.stringify(sample, null, 2);
  }
  if (typeof sample === 'string') {
    return sample;
  }
  return JSON.stringify(sample);
}

/** 从工具参数定义生成 ApiTestPanel 各分区参数 */
export function buildTestParamsFromToolParameters(parameters: ToolParameter[]): ApiTestParamsByIn {
  const result = createEmptyApiTestParams();

  for (const param of parameters) {
    const name = param.name.trim();
    if (!name) {
      continue;
    }

    result[param.in].push({
      id: param.id,
      name,
      in: param.in,
      value: stringifySampleValue(param),
      enabled: true,
      paramType: param.type,
      description: param.description,
    });
  }

  return result;
}

export type ToolParameterValidationIssue =
  | { code: 'empty_name'; index: number }
  | { code: 'invalid_name'; index: number; name: string }
  | { code: 'duplicate_name'; name: string; in: ToolParameterIn };

export function validateToolParameters(parameters: ToolParameter[]): ToolParameterValidationIssue | null {
  const seen = new Set<string>();

  for (let index = 0; index < parameters.length; index += 1) {
    const param = parameters[index];
    const name = param.name.trim();
    if (!name) {
      return { code: 'empty_name', index };
    }
    if (!PARAM_NAME_PATTERN.test(name)) {
      return { code: 'invalid_name', index, name };
    }
    const key = `${param.in}:${name}`;
    if (seen.has(key)) {
      return { code: 'duplicate_name', name, in: param.in };
    }
    seen.add(key);
  }

  return null;
}

export function getParameterValidationMessage(
  issue: ToolParameterValidationIssue,
  intl: { formatMessage: (descriptor: { id: string }, values?: Record<string, string | number>) => string },
): string {
  switch (issue.code) {
    case 'empty_name':
      return intl.formatMessage({ id: 'tool.params.nameRequired' });
    case 'invalid_name':
      return intl.formatMessage({ id: 'tool.params.nameInvalid' }, { name: issue.name });
    case 'duplicate_name':
      return intl.formatMessage(
        { id: 'tool.params.nameDuplicateIn' },
        { name: issue.name, in: issue.in },
      );
    default:
      return intl.formatMessage({ id: 'tool.actionFailed' });
  }
}
