import type {
  AgentMetadata,
  ParamFormatHint,
  ToolAgentMode,
} from '@/types/tool-agent-metadata';
import {
  OPERATION_TYPE_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
  TOOL_MODE_OPTIONS,
} from '@/types/tool-agent-metadata';
import type { ToolParameter } from './toolSchema';
import {
  buildSampleValueForBodyRoot,
  getParameterParentPath,
  normalizeParameterPath,
  partitionParameters,
} from './toolSchema';

export type AgentMetadataTemplateKey =
  | 'productDetail'
  | 'productList'
  | 'priceUpdate'
  | 'productCreate';

export const AGENT_METADATA_TEMPLATES: Record<
  AgentMetadataTemplateKey,
  AgentMetadata
> = {
  productDetail: {
    mode: 'READ',
    resource: 'PRODUCT',
    operation: 'DETAIL',
    businessFields: ['productId'],
    aliases: ['商品详情', '商品信息'],
    examples: ['查看商品详情', '查询商品售价'],
    priority: 100,
    isMutation: false,
    paramFormatHints: [],
  },
  productList: {
    mode: 'READ',
    resource: 'PRODUCT',
    operation: 'LIST',
    businessFields: [],
    aliases: ['商品列表', '多条件查询'],
    examples: ['查一批商品', '按条件搜索商品'],
    priority: 100,
    isMutation: false,
    paramFormatHints: [],
  },
  priceUpdate: {
    mode: 'WRITE',
    resource: 'PRICE',
    operation: 'UPDATE',
    businessFields: ['skuId', 'price'],
    aliases: ['价格', '售价', '定价', '批量改价'],
    examples: ['把价格改成99美元', '批量调整售价'],
    priority: 200,
    isMutation: true,
    paramFormatHints: [],
  },
  productCreate: {
    mode: 'WRITE',
    resource: 'PRODUCT',
    operation: 'CREATE',
    businessFields: ['productId'],
    aliases: ['创建商品', '新增商品'],
    examples: ['新建一个商品'],
    priority: 200,
    isMutation: true,
    paramFormatHints: [],
  },
};

function normalizeEnum<T extends string>(
  value: unknown,
  options: readonly T[],
): T | undefined {
  const upper = String(value ?? '')
    .trim()
    .toUpperCase();
  return options.includes(upper as T) ? (upper as T) : undefined;
}

export function normalizeParamFormatHints(value: unknown): ParamFormatHint[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return null;
      }
      const record = item as Record<string, unknown>;
      const param = String(record.param ?? '').trim();
      const hint = String(record.hint ?? '').trim();
      const exampleRaw = record.example;
      const example = typeof exampleRaw === 'string' ? exampleRaw.trim() : '';
      if (!param || !hint) {
        return null;
      }
      return example ? { param, hint, example } : { param, hint };
    })
    .filter((item): item is ParamFormatHint => item !== null);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item ?? '').trim()).filter(Boolean);
}

/** 逗号（中英文）分隔字符串 → 数组 */
export function parseCommaSeparatedList(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** 数组 → 逗号分隔展示 */
export function formatCommaSeparatedList(values: string[] | undefined): string {
  return (values ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ');
}

export function defaultPriorityForMode(mode: ToolAgentMode): number {
  if (mode === 'WRITE') {
    return 200;
  }
  if (mode === 'ADMIN') {
    return 150;
  }
  return 100;
}

function parseAgentMetadataRecord(
  raw: unknown,
): Record<string, unknown> | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return null;
}

export function normalizeAgentMetadata(raw: unknown): AgentMetadata | null {
  const item = parseAgentMetadataRecord(raw);
  if (!item) {
    return null;
  }
  const mode = normalizeEnum(item.mode, TOOL_MODE_OPTIONS);
  const resource = normalizeEnum(item.resource, RESOURCE_TYPE_OPTIONS);
  const operation = normalizeEnum(item.operation, OPERATION_TYPE_OPTIONS);
  if (!mode || !resource || !operation) {
    return null;
  }

  const priorityRaw = Number(item.priority);
  const priority = Number.isFinite(priorityRaw)
    ? priorityRaw
    : defaultPriorityForMode(mode);

  return {
    mode,
    resource,
    operation,
    businessFields: normalizeStringArray(item.businessFields),
    aliases: normalizeStringArray(item.aliases),
    examples: normalizeStringArray(item.examples),
    priority,
    isMutation: mode === 'WRITE',
    paramFormatHints: normalizeParamFormatHints(item.paramFormatHints),
  };
}

export function createEmptyAgentMetadata(
  mode: ToolAgentMode = 'READ',
): AgentMetadata {
  return {
    mode,
    resource: 'PRODUCT',
    operation: mode === 'WRITE' ? 'CREATE' : 'DETAIL',
    businessFields: [],
    aliases: [],
    examples: [],
    priority: defaultPriorityForMode(mode),
    isMutation: mode === 'WRITE',
    paramFormatHints: [],
  };
}

/** 根据 inputSchema 参数字段推断默认格式说明 */
export function deriveDefaultHintForParameter(
  param: ToolParameter,
): Pick<ParamFormatHint, 'hint' | 'example'> {
  const name = param.name.trim();
  const lower = name.toLowerCase();
  const format = (param.format ?? '').trim().toLowerCase();
  const description = param.description.trim();

  if (param.in === 'header') {
    return {
      hint: 'HTTP 请求头，值为字符串',
      example: name,
    };
  }

  if (param.type === 'integer' || param.type === 'number') {
    if (/^starttime$/i.test(name)) {
      return {
        hint: 'Unix 毫秒；「近7天」= 当前时间减 7 天的 00:00:00',
        example: '1717344000000',
      };
    }
    if (/^endtime$/i.test(name)) {
      return {
        hint: 'Unix 毫秒；通常为当前时刻',
        example: '1717948800000',
      };
    }
    if (
      lower.includes('time') ||
      format === 'int64' ||
      lower.includes('timestamp')
    ) {
      return {
        hint: 'Unix 毫秒时间戳',
        example: '1717344000000',
      };
    }
  }

  if (param.type === 'string') {
    if (
      /datefrom|startdate/i.test(lower) ||
      (format === 'date' && lower.includes('from'))
    ) {
      return { hint: 'yyyy-MM-dd，含当天', example: '2026-05-29' };
    }
    if (
      /dateto|enddate/i.test(lower) ||
      (format === 'date' && lower.includes('to'))
    ) {
      return { hint: 'yyyy-MM-dd，含当天', example: '2026-06-05' };
    }
    if (format === 'date' || /date/i.test(lower)) {
      return { hint: 'yyyy-MM-dd，含当天', example: '2026-05-29' };
    }
    if (format === 'date-time') {
      return { hint: 'ISO 8601 日期时间', example: '2026-05-29T00:00:00Z' };
    }
  }

  if (description) {
    return {
      hint: description,
      example: param.type === 'string' ? 'example' : undefined,
    };
  }

  if (param.type === 'boolean') {
    return { hint: '布尔值 true / false', example: 'false' };
  }

  if (param.type === 'integer' || param.type === 'number') {
    return { hint: '数值', example: '1' };
  }

  if (param.type === 'array') {
    const leaf = name.split('.').pop() ?? name;
    return {
      hint: `数组类型参数「${leaf}」，元素为对象时可继续配置子字段`,
      example: '[]',
    };
  }

  if (param.type === 'object') {
    const leaf = name.split('.').pop() ?? name;
    return {
      hint: `对象类型参数「${leaf}」，可包含嵌套字段`,
      example: '{}',
    };
  }

  const leaf = name.split('.').pop() ?? name;
  return {
    hint: description || `字符串类型参数「${leaf}」`,
    example: 'example',
  };
}

function buildHintFromParameter(
  param: ToolParameter,
  allParameters: ToolParameter[],
): ParamFormatHint {
  const derived = deriveDefaultHintForParameter(param);
  const paramName = normalizeParameterPath(param.name);
  let example = derived.example;

  if (
    param.in === 'body' &&
    (param.type === 'array' || param.type === 'object')
  ) {
    const { body } = partitionParameters(allParameters);
    const sample = buildSampleValueForBodyRoot(body, paramName);
    if (sample !== undefined && sample !== null) {
      example = JSON.stringify(sample, null, 2);
    }
  }

  return {
    param: paramName,
    hint: derived.hint,
    ...(example ? { example } : {}),
  };
}

function shouldAutoGenerateHint(param: ToolParameter): boolean {
  return (
    param.type === 'string' ||
    param.type === 'integer' ||
    param.type === 'number' ||
    param.type === 'boolean' ||
    param.type === 'object' ||
    param.type === 'array'
  );
}

/**
 * - 接口无该字段或为空时，为全部参数生成默认 hint
 * - 已有条目保留用户编辑，仅为新增参数补全
 */
export function syncParamFormatHintsWithParameters(
  parameters: ToolParameter[],
  hints: ParamFormatHint[] | undefined,
  options?: { regenerateAll?: boolean },
): ParamFormatHint[] {
  const regenerateAll = options?.regenerateAll ?? false;
  const validParameters = parameters
    .map((item) => ({ ...item, name: normalizeParameterPath(item.name) }))
    .filter((item) => item.name);
  if (validParameters.length === 0) {
    return hints ?? [];
  }

  const existingByParam = new Map(
    (hints ?? []).map((item) => [item.param, item]),
  );
  const result: ParamFormatHint[] = [];
  const seen = new Set<string>();

  if (!regenerateAll && (hints?.length ?? 0) > 0) {
    for (const hint of hints ?? []) {
      if (
        validParameters.some((param) => param.name.trim() === hint.param) &&
        !seen.has(hint.param)
      ) {
        result.push(hint);
        seen.add(hint.param);
      }
    }
  }

  for (const param of validParameters) {
    const name = param.name.trim();
    if (seen.has(name) || !shouldAutoGenerateHint(param)) {
      continue;
    }
    const saved = !regenerateAll ? existingByParam.get(name) : undefined;
    result.push(saved ?? buildHintFromParameter(param, parameters));
    seen.add(name);
  }

  return result;
}

export function buildParamNameOptionsFromParameters(
  parameters: ToolParameter[],
): Array<{ value: string; label: string }> {
  return parameters
    .filter((param) => param.name.trim())
    .map((param) => {
      const name = normalizeParameterPath(param.name);
      const parent = getParameterParentPath(name);
      const meta = [param.in, param.type, param.format?.trim()]
        .filter(Boolean)
        .join(' · ');
      const prefix = parent ? `${parent} → ` : '';
      return {
        value: name,
        label: meta ? `${prefix}${name} · ${meta}` : `${prefix}${name}`,
      };
    });
}

/** 与服务端 deriveDecisionRoleFromAgentMetadata 规则对齐（只读展示） */
export function deriveDecisionRoleFromAgentMetadata(
  meta: AgentMetadata,
): string {
  const { mode, resource, operation } = meta;

  if (mode === 'ADMIN') {
    return 'admin';
  }

  if (mode === 'READ') {
    if (operation === 'DETAIL') {
      return 'read-detail';
    }
    if (operation === 'LIST' || operation === 'SEARCH') {
      return 'read-list';
    }
    if (operation === 'STATS') {
      return 'read-stats';
    }
    return 'unknown';
  }

  if (mode === 'WRITE') {
    if (operation === 'CREATE') {
      return 'write-single';
    }
    if (operation === 'UPDATE') {
      if (resource === 'PRICE' || resource === 'INVENTORY') {
        return 'write-batch';
      }
      if (
        resource === 'COLLECTION' ||
        resource === 'SEO' ||
        resource === 'CATEGORY'
      ) {
        return 'write-meta';
      }
      return 'write-single';
    }
    if (operation === 'DELETE') {
      return 'write-single';
    }
    return 'unknown';
  }

  return 'unknown';
}

export function buildAgentMetadataForPersist(
  raw: AgentMetadata | null | undefined,
): AgentMetadata | null | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (raw === null) {
    return null;
  }

  const mode = normalizeEnum(raw.mode, TOOL_MODE_OPTIONS);
  const resource = normalizeEnum(raw.resource, RESOURCE_TYPE_OPTIONS);
  const operation = normalizeEnum(raw.operation, OPERATION_TYPE_OPTIONS);
  if (!mode || !resource || !operation) {
    return null;
  }

  const priorityRaw = Number(raw.priority);
  const priority = Number.isFinite(priorityRaw)
    ? priorityRaw
    : defaultPriorityForMode(mode);

  return {
    mode,
    resource,
    operation,
    businessFields: normalizeStringArray(raw.businessFields),
    aliases: normalizeStringArray(raw.aliases),
    examples: normalizeStringArray(raw.examples),
    priority,
    isMutation: mode === 'WRITE',
    paramFormatHints: normalizeParamFormatHints(raw.paramFormatHints).filter(
      (item) => item.param && item.hint,
    ),
  };
}

export function isAgentMetadataFormComplete(
  raw: AgentMetadata | null | undefined,
): raw is AgentMetadata {
  if (!raw || typeof raw !== 'object') {
    return false;
  }
  return Boolean(
    normalizeEnum(raw.mode, TOOL_MODE_OPTIONS) &&
    normalizeEnum(raw.resource, RESOURCE_TYPE_OPTIONS) &&
    normalizeEnum(raw.operation, OPERATION_TYPE_OPTIONS),
  );
}

export type OutputSchemaFieldLike = {
  name: string;
  type?: string;
};

function normalizeOutputFieldPath(path: string): string {
  return path.trim().replace(/\[\]/g, '');
}

/** 从 inputSchema 参数列表生成 businessFields 下拉选项 */
export function buildBusinessFieldOptionsFromParameters(
  parameters: ToolParameter[],
): Array<{ value: string; label: string }> {
  return parameters
    .filter((param) => param.name.trim())
    .map((param) => {
      const name = normalizeParameterPath(param.name);
      const parent = getParameterParentPath(name);
      const meta = [param.in, param.type, param.format?.trim()]
        .filter(Boolean)
        .join(' · ');
      const prefix = parent ? `${parent} → ` : '';
      return {
        value: name,
        label: meta ? `${prefix}${name} · ${meta}` : `${prefix}${name}`,
      };
    })
    .sort((a, b) => a.value.localeCompare(b.value));
}

/** 合并参数选项与已保存的 businessFields，保证回显 */
export function mergeBusinessFieldOptions(
  parameters: ToolParameter[],
  selected: string[] | undefined,
  savedLabel = 'saved',
): Array<{ value: string; label: string }> {
  const base = buildBusinessFieldOptionsFromParameters(parameters);
  const seen = new Set(base.map((item) => item.value));
  const extras = (selected ?? [])
    .map((item) => normalizeParameterPath(item))
    .filter((name) => name && !seen.has(name))
    .map((name) => ({
      value: name,
      label: `${name} · ${savedLabel}`,
    }));
  return [...base, ...extras];
}

/** 将模板/历史 businessFields 名解析为 inputSchema 参数名 */
export function resolveBusinessFieldsToParameters(
  names: string[],
  parameters: ToolParameter[],
): string[] {
  const paramNames = parameters
    .map((param) => normalizeParameterPath(param.name))
    .filter(Boolean);

  if (paramNames.length === 0) {
    return names.map((item) => String(item ?? '').trim()).filter(Boolean);
  }

  const nameSet = new Set(paramNames);
  const resolved: string[] = [];

  names.forEach((raw) => {
    const name = normalizeParameterPath(String(raw ?? ''));
    if (!name) {
      return;
    }
    if (nameSet.has(name)) {
      resolved.push(name);
      return;
    }
    const match = paramNames.find(
      (paramName) => paramName === name || paramName.endsWith(`.${name}`),
    );
    if (match) {
      resolved.push(match);
      return;
    }
    resolved.push(name);
  });

  return Array.from(new Set(resolved));
}

/** 去掉已不在 inputSchema 参数列表中的 businessFields */
export function pruneBusinessFieldsAgainstParameters(
  selected: string[] | undefined,
  parameters: ToolParameter[],
): string[] {
  const allowed = new Set(
    buildBusinessFieldOptionsFromParameters(parameters).map(
      (item) => item.value,
    ),
  );
  return (selected ?? []).filter((item) =>
    allowed.has(normalizeParameterPath(item)),
  );
}

/** @deprecated 使用 buildBusinessFieldOptionsFromParameters */
export function buildBusinessFieldOptionsFromOutputSchema(
  fields: OutputSchemaFieldLike[],
): Array<{ value: string; label: string }> {
  return fields
    .map((field) => normalizeOutputFieldPath(field.name))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((path) => ({
      value: path,
      label: `${path} · ${fields.find((f) => normalizeOutputFieldPath(f.name) === path)?.type ?? 'string'}`,
    }));
}

/** @deprecated 使用 resolveBusinessFieldsToParameters */
export function resolveBusinessFieldsToOutputPaths(
  names: string[],
  fields: OutputSchemaFieldLike[],
): string[] {
  return resolveBusinessFieldsToParameters(
    names,
    fields.map((field, index) => ({
      id: `legacy_${index}`,
      name: field.name,
      in: 'query' as const,
      type: 'string' as const,
      required: false,
      description: '',
    })),
  );
}

/** @deprecated 使用 pruneBusinessFieldsAgainstParameters */
export function pruneBusinessFieldsAgainstOutputSchema(
  selected: string[] | undefined,
  fields: OutputSchemaFieldLike[],
): string[] {
  return pruneBusinessFieldsAgainstParameters(
    selected,
    fields.map((field, index) => ({
      id: `legacy_${index}`,
      name: field.name,
      in: 'query' as const,
      type: 'string' as const,
      required: false,
      description: '',
    })),
  );
}
