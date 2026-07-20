import type { ApiTestParamsByIn } from '@/components/ApiTestPanel';
import { createEmptyApiTestParams } from '@/components/ApiTestPanel';
import type {
  ApiTestParamIn,
  ApiTestParamRow,
} from '@/components/ApiTestPanel/types';

const API_TEST_SECTIONS: ApiTestParamIn[] = ['path', 'query', 'header', 'body'];

/** OpenAPI 参数位置（与后端 inputSchema.parameters[].in 一致） */
export type ToolParameterIn = 'path' | 'query' | 'header' | 'body';

export type ToolParameterType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array';

export type ToolParameter = {
  id: string;
  name: string;
  in: ToolParameterIn;
  type: ToolParameterType;
  format?: string;
  required: boolean;
  description: string;
};

/** 扁平字段行，用于构建嵌套 JSON Schema */
type SchemaFieldRow = {
  name: string;
  type: ToolParameterType;
  required: boolean;
  description: string;
  format?: string;
};

/** 后端 inputSchema / schema 运行时结构 */
export type ToolOpenApiInputSchema = {
  parameters: Record<string, unknown>[];
  requestBody: unknown;
};

const PARAM_IN_VALUES: ToolParameterIn[] = ['path', 'query', 'header', 'body'];
const PARAM_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
const PARAM_PATH_SEGMENT_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;

export function splitParameterPath(path: string): string[] {
  return path
    .split('.')
    .map((token) => token.trim())
    .filter(Boolean);
}

export function normalizeParameterPath(path: string): string {
  return path.trim().replace(/\[\]/g, '');
}

export function getParameterParentPath(path: string): string | null {
  const normalized = normalizeParameterPath(path);
  if (!normalized) {
    return null;
  }
  const tokens = splitParameterPath(normalized);
  if (tokens.length <= 1) {
    return null;
  }
  return tokens.slice(0, -1).join('.');
}

export function createEmptyParameter(
  overrides?: Partial<ToolParameter>,
): ToolParameter {
  return {
    id: `param_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    in: 'query',
    type: 'string',
    format: '',
    required: false,
    description: '',
    ...overrides,
  };
}

export function createEmptyBodyParameter(name = ''): ToolParameter {
  return createEmptyParameter({
    in: 'body',
    name,
    type: name ? 'string' : 'object',
  });
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

function schemaHasNestedStructure(schema: Record<string, unknown>): boolean {
  const type = normalizeParameterType(schema.type);
  if (type === 'object') {
    const properties =
      typeof schema.properties === 'object' && schema.properties !== null
        ? (schema.properties as Record<string, unknown>)
        : undefined;
    return Boolean(properties && Object.keys(properties).length > 0);
  }
  if (type === 'array') {
    const items =
      typeof schema.items === 'object' && schema.items !== null
        ? (schema.items as Record<string, unknown>)
        : undefined;
    if (!items) {
      return false;
    }
    return (
      schemaHasNestedStructure(items) ||
      normalizeParameterType(items.type) !== 'string'
    );
  }
  return false;
}

function createParameterId(
  prefix: string,
  path: string,
  index: number,
): string {
  return `${prefix}_${path.replace(/\./g, '_')}_${index}`;
}

function collectParameterFieldsFromSchema(
  schemaNode: Record<string, unknown>,
  parentPath: string,
  inheritedRequired: boolean,
  paramIn: ToolParameterIn,
  collector: ToolParameter[],
  skipSelfPush = false,
  indexSeed = 0,
) {
  const nodeType = normalizeParameterType(schemaNode.type);
  const currentPath = normalizeParameterPath(parentPath);
  const description =
    typeof schemaNode.description === 'string' ? schemaNode.description : '';
  const format = typeof schemaNode.format === 'string' ? schemaNode.format : '';

  if (currentPath && !skipSelfPush) {
    collector.push({
      id: createParameterId(paramIn, currentPath, collector.length + indexSeed),
      name: currentPath,
      in: paramIn,
      type: nodeType,
      format,
      required: inheritedRequired,
      description,
    });
  }

  if (nodeType === 'object') {
    const properties =
      typeof schemaNode.properties === 'object' &&
      schemaNode.properties !== null
        ? (schemaNode.properties as Record<string, unknown>)
        : undefined;
    if (!properties) {
      return;
    }
    const requiredSet = new Set(
      Array.isArray(schemaNode.required)
        ? schemaNode.required.map((item) => String(item))
        : [],
    );
    Object.entries(properties).forEach(([key, value]) => {
      if (typeof value !== 'object' || value === null) {
        return;
      }
      const childPath = currentPath ? `${currentPath}.${key}` : key;
      collectParameterFieldsFromSchema(
        value as Record<string, unknown>,
        childPath,
        requiredSet.has(key),
        paramIn,
        collector,
        false,
        indexSeed,
      );
    });
    return;
  }

  if (nodeType === 'array') {
    const items =
      typeof schemaNode.items === 'object' && schemaNode.items !== null
        ? (schemaNode.items as Record<string, unknown>)
        : undefined;
    if (!items) {
      return;
    }
    collectParameterFieldsFromSchema(
      items,
      currentPath,
      false,
      paramIn,
      collector,
      true,
      indexSeed,
    );
  }
}

function extractParametersArray(schema?: object): Record<string, unknown>[] {
  if (!schema || typeof schema !== 'object') {
    return [];
  }
  const root = schema as Record<string, unknown>;
  const rawParameters = root.parameters;
  if (!Array.isArray(rawParameters)) {
    return [];
  }
  return rawParameters.filter(
    (item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null,
  );
}

/** 统一表单中的参数行，保证回显字段完整 */
export function normalizeToolParameters(
  parameters: ToolParameter[] | undefined,
): ToolParameter[] {
  if (!Array.isArray(parameters)) {
    return [];
  }
  return parameters.map((param, index) => ({
    id: param.id?.trim() || `param_${index}_${Date.now()}`,
    name: normalizeParameterPath(param.name ?? ''),
    in: normalizeParameterIn(param.in),
    type: normalizeParameterType(param.type),
    format: typeof param.format === 'string' ? param.format : '',
    required: Boolean(param.required),
    description: typeof param.description === 'string' ? param.description : '',
  }));
}

function parseFlatOpenApiParameter(
  raw: Record<string, unknown>,
  index: number,
): ToolParameter | null {
  const name = String(raw.name ?? '').trim();
  if (!name) {
    return null;
  }

  const paramIn = normalizeParameterIn(raw.in);
  let type: ToolParameterType = 'string';
  let format = typeof raw.format === 'string' ? raw.format : '';

  if (
    paramIn === 'body' &&
    typeof raw.schema === 'object' &&
    raw.schema !== null
  ) {
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

function parseOpenApiParameter(
  raw: Record<string, unknown>,
  index: number,
): ToolParameter[] {
  const name = String(raw.name ?? '').trim();
  if (!name) {
    return [];
  }

  const paramIn = normalizeParameterIn(raw.in);
  if (
    paramIn === 'body' &&
    typeof raw.schema === 'object' &&
    raw.schema !== null
  ) {
    const bodySchema = raw.schema as Record<string, unknown>;
    if (schemaHasNestedStructure(bodySchema)) {
      const collector: ToolParameter[] = [];
      collectParameterFieldsFromSchema(
        bodySchema,
        name,
        Boolean(raw.required),
        'body',
        collector,
        false,
        index,
      );
      if (collector.length > 0) {
        return collector;
      }
    }
  }

  const flat = parseFlatOpenApiParameter(raw, index);
  return flat ? [flat] : [];
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
export function parametersFromToolSchemas(
  inputSchema?: object,
  schema?: object,
): ToolParameter[] {
  const fromInput = normalizeToolParameters(
    extractParametersArray(inputSchema).flatMap((item, index) =>
      parseOpenApiParameter(item, index),
    ),
  );
  if (fromInput.length > 0) {
    return fromInput;
  }

  const fromSchema = normalizeToolParameters(
    extractParametersArray(schema).flatMap((item, index) =>
      parseOpenApiParameter(item, index),
    ),
  );
  if (fromSchema.length > 0) {
    return fromSchema;
  }

  const legacyInput = normalizeToolParameters(
    parametersFromJsonSchemaProperties(inputSchema),
  );
  if (legacyInput.length > 0) {
    return legacyInput;
  }

  return normalizeToolParameters(parametersFromJsonSchemaProperties(schema));
}

/** @deprecated 使用 parametersFromToolSchemas */
export function parametersFromSchema(schema?: object): ToolParameter[] {
  return parametersFromToolSchemas(schema, undefined);
}

export function isBodyParameter(param: ToolParameter): boolean {
  return param.in === 'body';
}

export function partitionParameters(parameters: ToolParameter[]): {
  simple: ToolParameter[];
  body: ToolParameter[];
} {
  const simple: ToolParameter[] = [];
  const body: ToolParameter[] = [];
  parameters.forEach((param) => {
    if (param.in === 'body') {
      body.push(param);
    } else {
      simple.push(param);
    }
  });
  return { simple, body };
}

export function findBodyRootPaths(parameters: ToolParameter[]): string[] {
  const bodyNames = new Set(
    parameters
      .filter((param) => param.in === 'body')
      .map((param) => normalizeParameterPath(param.name))
      .filter(Boolean),
  );

  return Array.from(bodyNames).filter((name) => {
    const parent = getParameterParentPath(name);
    return !parent || !bodyNames.has(parent);
  });
}

function buildNestedJsonSchemaFromPaths(
  fields: SchemaFieldRow[],
  rootPath: string,
): Record<string, unknown> {
  const normalizedRoot = normalizeParameterPath(rootPath);
  const related = fields
    .map((field) => ({
      ...field,
      name: normalizeParameterPath(field.name),
    }))
    .filter(
      (field) =>
        field.name === normalizedRoot ||
        field.name.startsWith(`${normalizedRoot}.`),
    );

  const rootField = related.find((field) => field.name === normalizedRoot);
  const rootType = rootField?.type ?? 'object';

  if (rootType !== 'object' && rootType !== 'array') {
    const leaf: Record<string, unknown> = { type: rootType };
    if (rootField?.format?.trim()) {
      leaf.format = rootField.format.trim();
    }
    if (rootField?.description?.trim()) {
      leaf.description = rootField.description.trim();
    }
    return leaf;
  }

  const rootSchema: Record<string, unknown> = { type: rootType };
  if (rootField?.description?.trim()) {
    rootSchema.description = rootField.description.trim();
  }

  const fieldByPath = new Map<string, SchemaFieldRow>();
  related.forEach((field) => fieldByPath.set(field.name, field));

  const ensureObjectNode = (
    parent: Record<string, unknown>,
    key: string,
  ): Record<string, unknown> => {
    const properties = (parent.properties ?? {}) as Record<string, unknown>;
    const existing =
      typeof properties[key] === 'object' && properties[key] !== null
        ? (properties[key] as Record<string, unknown>)
        : undefined;
    if (existing && existing.type === 'object') {
      if (!existing.properties) {
        existing.properties = {};
      }
      return existing;
    }
    const created: Record<string, unknown> = { type: 'object', properties: {} };
    properties[key] = created;
    parent.properties = properties;
    return created;
  };

  const ensureArrayNode = (
    parent: Record<string, unknown>,
    key: string,
  ): Record<string, unknown> => {
    const properties = (parent.properties ?? {}) as Record<string, unknown>;
    const existing =
      typeof properties[key] === 'object' && properties[key] !== null
        ? (properties[key] as Record<string, unknown>)
        : undefined;
    if (existing && existing.type === 'array') {
      if (!existing.items || typeof existing.items !== 'object') {
        existing.items = { type: 'object', properties: {} };
      }
      return existing;
    }
    const created: Record<string, unknown> = {
      type: 'array',
      items: { type: 'object', properties: {} },
    };
    properties[key] = created;
    parent.properties = properties;
    return created;
  };

  if (rootType === 'array') {
    if (!rootSchema.items || typeof rootSchema.items !== 'object') {
      rootSchema.items = { type: 'object', properties: {} };
    }
  } else if (!rootSchema.properties) {
    rootSchema.properties = {};
  }

  related.forEach((field) => {
    const tokens = splitParameterPath(field.name);
    if (tokens.length === 0 || tokens[0] !== normalizedRoot) {
      return;
    }

    const relativeTokens = tokens.slice(1);
    if (relativeTokens.length === 0) {
      return;
    }

    let node =
      rootType === 'array'
        ? ((rootSchema.items ?? { type: 'object', properties: {} }) as Record<
            string,
            unknown
          >)
        : rootSchema;
    if (node.type !== 'object') {
      node.type = 'object';
    }
    if (!node.properties) {
      node.properties = {};
    }

    for (let index = 0; index < relativeTokens.length; index += 1) {
      const key = relativeTokens[index];
      const isLeaf = index === relativeTokens.length - 1;
      const pathSoFar = [
        normalizedRoot,
        ...relativeTokens.slice(0, index + 1),
      ].join('.');
      const segmentField = fieldByPath.get(pathSoFar);
      const isArraySegment = segmentField?.type === 'array';

      if (!isLeaf) {
        if (isArraySegment) {
          const arrayNode = ensureArrayNode(node, key);
          node =
            typeof arrayNode.items === 'object' && arrayNode.items !== null
              ? (arrayNode.items as Record<string, unknown>)
              : { type: 'object', properties: {} };
          if (!arrayNode.items) {
            arrayNode.items = node;
          }
          if (node.type !== 'object') {
            node.type = 'object';
          }
          if (!node.properties) {
            node.properties = {};
          }
        } else {
          node = ensureObjectNode(node, key);
        }
        continue;
      }

      const properties = (node.properties ?? {}) as Record<string, unknown>;
      const leafSchema: Record<string, unknown> = { type: field.type };
      if (field.format?.trim()) {
        leafSchema.format = field.format.trim();
      }
      if (field.description.trim()) {
        leafSchema.description = field.description.trim();
      }
      if (field.type === 'object' && !leafSchema.properties) {
        leafSchema.properties = {};
      }
      if (field.type === 'array' && !leafSchema.items) {
        leafSchema.items = { type: 'object', properties: {} };
      }
      properties[key] = leafSchema;
      node.properties = properties;

      if (field.required) {
        const req = Array.isArray(node.required)
          ? [...(node.required as unknown[]).map((item) => String(item))]
          : [];
        if (!req.includes(key)) {
          req.push(key);
        }
        node.required = req;
      }
    }
  });

  return rootSchema;
}

function buildOpenApiParameterDefinition(
  param: ToolParameter,
): Record<string, unknown> {
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

function buildBodyOpenApiParameterDefinitions(
  bodyParameters: ToolParameter[],
): Record<string, unknown>[] {
  const roots = findBodyRootPaths(bodyParameters);
  const rows: SchemaFieldRow[] = bodyParameters.map((param) => ({
    name: param.name,
    type: param.type,
    required: param.required,
    description: param.description,
    format: param.format,
  }));

  return roots.map((rootPath) => {
    const rootParam = bodyParameters.find(
      (param) => normalizeParameterPath(param.name) === rootPath,
    );
    const definition: Record<string, unknown> = {
      in: 'body',
      name: rootPath,
      required: rootParam?.required ?? false,
      schema: buildNestedJsonSchemaFromPaths(rows, rootPath),
    };
    if (rootParam?.description.trim()) {
      definition.description = rootParam.description.trim();
    }
    return definition;
  });
}

/** 构建运行时 inputSchema（LLM + HTTP 拆参） */
export function buildInputSchemaFromParameters(
  parameters: ToolParameter[],
): ToolOpenApiInputSchema {
  const { simple, body } = partitionParameters(parameters);
  const simpleItems = simple
    .map((param) => buildOpenApiParameterDefinition(param))
    .filter((param) => String(param.name ?? '').trim().length > 0);
  const bodyItems = buildBodyOpenApiParameterDefinitions(body).filter(
    (param) => String(param.name ?? '').trim().length > 0,
  );

  return {
    parameters: [...simpleItems, ...bodyItems],
    requestBody: null,
  };
}

/** schema 作为与 inputSchema 同结构的备用字段 */
export function buildSchemaFromParameters(
  parameters: ToolParameter[],
): ToolOpenApiInputSchema {
  return buildInputSchemaFromParameters(parameters);
}

function sampleValueForType(
  type: ToolParameterType,
  required: boolean,
): unknown {
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

export function buildSampleValueForBodyRoot(
  bodyParameters: ToolParameter[],
  rootPath: string,
): unknown {
  const normalizedRoot = normalizeParameterPath(rootPath);
  const rootParam = bodyParameters.find(
    (param) => normalizeParameterPath(param.name) === normalizedRoot,
  );
  if (!rootParam) {
    return sampleValueForType('object', false);
  }

  const descendants = bodyParameters.filter((param) => {
    const name = normalizeParameterPath(param.name);
    return name.startsWith(`${normalizedRoot}.`);
  });

  if (descendants.length === 0) {
    return sampleValueForType(rootParam.type, rootParam.required);
  }

  const buildObjectSample = (parentPath: string): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    const directChildren = new Map<string, ToolParameter>();

    descendants.forEach((param) => {
      const name = normalizeParameterPath(param.name);
      const relative = name.slice(parentPath.length + 1);
      const firstToken = relative.split('.')[0];
      if (!firstToken || relative.includes('.')) {
        return;
      }
      if (!directChildren.has(firstToken)) {
        directChildren.set(firstToken, param);
      }
    });

    directChildren.forEach((param, key) => {
      const fullPath = `${parentPath}.${key}`;
      const nested = descendants.some((item) => {
        const name = normalizeParameterPath(item.name);
        return name.startsWith(`${fullPath}.`);
      });

      if (param.type === 'array') {
        const itemSample = nested
          ? buildObjectSample(fullPath)
          : sampleValueForType('object', false);
        result[key] = [itemSample];
        return;
      }

      if (param.type === 'object' || nested) {
        result[key] = nested
          ? buildObjectSample(fullPath)
          : sampleValueForType('object', false);
        return;
      }

      result[key] = sampleValueForType(param.type, param.required);
    });

    return result;
  };

  if (rootParam.type === 'array') {
    return [buildObjectSample(normalizedRoot)];
  }

  if (rootParam.type === 'object') {
    return buildObjectSample(normalizedRoot);
  }

  return sampleValueForType(rootParam.type, rootParam.required);
}

function stringifySampleValue(
  param: ToolParameter,
  bodyParameters?: ToolParameter[],
): string {
  if (param.in === 'body' && bodyParameters) {
    const rootPaths = findBodyRootPaths(bodyParameters);
    const normalizedName = normalizeParameterPath(param.name);
    if (rootPaths.includes(normalizedName)) {
      const sample = buildSampleValueForBodyRoot(
        bodyParameters,
        normalizedName,
      );
      return JSON.stringify(sample, null, 2);
    }
  }

  const sample = sampleValueForType(param.type, param.required);
  if (
    param.in === 'body' &&
    (param.type === 'object' || param.type === 'array')
  ) {
    return JSON.stringify(sample, null, 2);
  }
  if (typeof sample === 'string') {
    return sample;
  }
  return JSON.stringify(sample);
}

/** 从工具参数定义生成 ApiTestPanel 各分区参数 */
export function buildTestParamsFromToolParameters(
  parameters: ToolParameter[],
): ApiTestParamsByIn {
  const result = createEmptyApiTestParams();
  const { simple, body } = partitionParameters(parameters);
  const bodyRoots = new Set(findBodyRootPaths(body));

  for (const param of simple) {
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

  for (const param of body) {
    const name = normalizeParameterPath(param.name);
    if (!name || !bodyRoots.has(name)) {
      continue;
    }

    result.body.push({
      id: param.id,
      name,
      in: 'body',
      value: stringifySampleValue(param, body),
      enabled: true,
      paramType: param.type,
      description: param.description,
    });
  }

  return result;
}

function testParamLookupKey(row: { in: ApiTestParamIn; name: string }): string {
  return `${row.in}:${normalizeParameterPath(row.name)}`;
}

/** 将工具参数合并进调试台：新增参数自动出现，已有值保留，手动添加的 test_ 行保留 */
export function mergeTestParamsWithToolParameters(
  current: ApiTestParamsByIn,
  parameters: ToolParameter[],
): ApiTestParamsByIn {
  const fromTool = buildTestParamsFromToolParameters(parameters);
  const existingById = new Map<string, ApiTestParamRow>();
  const existingByKey = new Map<string, ApiTestParamRow>();

  for (const section of API_TEST_SECTIONS) {
    for (const row of current[section]) {
      existingById.set(row.id, row);
      const key = testParamLookupKey(row);
      if (key.endsWith(':')) {
        continue;
      }
      existingByKey.set(key, row);
    }
  }

  const merged = createEmptyApiTestParams();

  for (const section of API_TEST_SECTIONS) {
    for (const row of fromTool[section]) {
      const key = testParamLookupKey(row);
      const existing = existingById.get(row.id) ?? existingByKey.get(key);
      merged[section].push(
        existing
          ? {
              ...row,
              id: existing.id,
              value: existing.value,
              enabled: existing.enabled,
            }
          : row,
      );
    }

    for (const row of current[section]) {
      if (row.id.startsWith('test_')) {
        merged[section].push(row);
      }
    }
  }

  return merged;
}

export type ToolParameterValidationIssue =
  | { code: 'empty_name'; index: number }
  | { code: 'invalid_name'; index: number; name: string }
  | { code: 'invalid_nested'; index: number; name: string }
  | { code: 'invalid_path_segment'; index: number; name: string }
  | { code: 'duplicate_name'; name: string; in: ToolParameterIn };

export function validateToolParameters(
  parameters: ToolParameter[],
): ToolParameterValidationIssue | null {
  const seen = new Set<string>();

  for (let index = 0; index < parameters.length; index += 1) {
    const param = parameters[index];
    const name = normalizeParameterPath(param.name);
    if (!name) {
      return { code: 'empty_name', index };
    }

    const segments = splitParameterPath(name);
    if (param.in === 'body') {
      if (
        segments.length === 0 ||
        segments.some((segment) => !PARAM_PATH_SEGMENT_PATTERN.test(segment))
      ) {
        return { code: 'invalid_path_segment', index, name };
      }
    } else if (name.includes('.')) {
      return { code: 'invalid_nested', index, name };
    } else if (!PARAM_NAME_PATTERN.test(name)) {
      return { code: 'invalid_name', index, name };
    }

    const key = `${param.in}:${normalizeParameterPath(name)}`;
    if (seen.has(key)) {
      return { code: 'duplicate_name', name, in: param.in };
    }
    seen.add(key);
  }

  return null;
}

export function getParameterValidationMessage(
  issue: ToolParameterValidationIssue,
  intl: {
    formatMessage: (
      descriptor: { id: string },
      values?: Record<string, string | number>,
    ) => string;
  },
): string {
  switch (issue.code) {
    case 'empty_name':
      return intl.formatMessage({ id: 'tool.params.nameRequired' });
    case 'invalid_name':
      return intl.formatMessage(
        { id: 'tool.params.nameInvalid' },
        { name: issue.name },
      );
    case 'invalid_nested':
      return intl.formatMessage(
        { id: 'tool.params.nestedBodyOnly' },
        { name: issue.name },
      );
    case 'invalid_path_segment':
      return intl.formatMessage(
        { id: 'tool.params.pathSegmentInvalid' },
        { name: issue.name },
      );
    case 'duplicate_name':
      return intl.formatMessage(
        { id: 'tool.params.nameDuplicateIn' },
        { name: issue.name, in: issue.in },
      );
    default:
      return intl.formatMessage({ id: 'tool.actionFailed' });
  }
}
