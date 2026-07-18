import { useProjectRoute } from '@/hooks/useProjectRoute';
import { IntegrationController_findByAppClient } from '@/services/integration';
import {
  ToolController_batchSetActive,
  ToolController_findPage,
  ToolController_importFromSwagger,
  ToolController_remove,
  ToolController_update,
} from '@/services/tool';
import type { Integration } from '@/types/integration';
import type {
  CreateToolDto,
  Tool,
  ToolHttpMethod,
  ToolResponseProfile,
  ToolRiskLevel,
  ToolStatus,
  UpdateToolDto,
} from '@/types/tool';
import type { AgentMetadata } from '@/types/tool-agent-metadata';
import { history, useIntl } from '@umijs/max';
import { message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildAgentMetadataForPersist } from './toolAgentMetadata';

import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import {
  buildImportToolsFromSwaggerDto,
  type ImportToolsFromSwaggerFormValues,
} from './importSwagger';
import { SEARCH_DEBOUNCE_MS } from './toolConstants';
import type { ToolParameter } from './toolSchema';
import {
  buildInputSchemaFromParameters,
  buildSchemaFromParameters,
} from './toolSchema';

export {
  DEFAULT_EMPTY_SCHEMA,
  DEFAULT_TOOL_METHOD,
  DEFAULT_TOOL_RISK,
  SEARCH_DEBOUNCE_MS,
} from './toolConstants';
export { normalizeTool } from './toolNormalize';

export type ToolFormValues = {
  name: string;
  description: string;
  method: ToolHttpMethod;
  path: string;
  integrationId: number;
  riskLevel: ToolRiskLevel;
  isActive: boolean;
  parameters: ToolParameter[];
  outputSchemaFields: ToolOutputSchemaField[];
  responseCoreFields: ToolCoreFieldRow[];
  responseOptionalFields: ToolCoreFieldRow[];
  responseListMetaFields: ToolCoreFieldRow[];
  responseEntityType?: string;
  responseDecisionRole?: import('@/types/tool').ToolDecisionRole | string;
  responseListPath?: string;
  responseArrayLimitsMaxItems?: number;
  agentMetadata: AgentMetadata | null;
};

export type ToolOutputSchemaField = {
  id: string;
  statusCode: string;
  name: string;
  type:
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'object'
    | 'array'
    | 'null';
  required: boolean;
  description: string;
};

export type ToolCoreFieldRow = {
  id: string;
  path: string;
  label: string;
  description: string;
  keywords: string[];
};

export type UseToolsResult = {
  projectId: number;
  tools: Tool[];
  loading: boolean;
  keyword: string;
  page: number;
  pageSize: number;
  total: number;
  isSearchActive: boolean;
  summaryText: string | null;
  showEmpty: boolean;
  showPagination: boolean;
  setKeyword: (value: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
  openCreate: () => void;
  openConfigure: (tool: Tool) => void;
  handleDelete: (id: number) => Promise<void>;
  handleToggleActive: (tool: Tool) => Promise<void>;
  selectedIds: number[];
  selectedCount: number;
  isAllCurrentPageSelected: boolean;
  isSelectionIndeterminate: boolean;
  batchSubmitting: boolean;
  toggleSelect: (id: number, checked: boolean) => void;
  toggleSelectAllCurrentPage: (checked: boolean) => void;
  clearSelection: () => void;
  handleBatchEnable: () => Promise<void>;
  handleBatchDisable: () => Promise<void>;
  toDetailPath: (toolId: number) => string;
  importModalOpen: boolean;
  importSubmitting: boolean;
  importIntegrations: Integration[];
  importIntegrationsLoading: boolean;
  openImportModal: () => void;
  onImportModalOpenChange: (open: boolean) => void;
  handleImportFromSwagger: (
    values: ImportToolsFromSwaggerFormValues,
  ) => Promise<boolean>;
};

export function getToolStatus(tool: Tool): ToolStatus {
  if (!tool.isActive) {
    return 'inactive';
  }

  if (!tool.integrationId || !tool.path.trim()) {
    return 'config_required';
  }

  const integration = tool.integration;
  if (
    integration?.authMode === 'SYSTEM_ONLY' &&
    !integration.systemConfigured
  ) {
    return 'config_required';
  }

  return 'active';
}

export function getToolCategoryLabel(tool: Tool): string {
  return tool.toolCategory?.label ?? tool.tags?.[0] ?? '';
}

export function formatIntegrationHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}

function buildSchemaFields(parameters: ToolParameter[]) {
  const inputSchema = buildInputSchemaFromParameters(parameters);
  const schema = buildSchemaFromParameters(parameters);
  return {
    inputSchema,
    schema,
  };
}

export function stringifyToolJsonField(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

export function parseToolJsonObjectField(text: string): object | undefined {
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed: unknown = JSON.parse(trimmed);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('invalid_json_object');
  }
  return parsed as object;
}

function asObject(raw: unknown): Record<string, unknown> | undefined {
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
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
      return undefined;
    }
  }
  return undefined;
}

function looksLikeSchemaNode(node: Record<string, unknown>): boolean {
  if (
    typeof node.type === 'string' &&
    (node.properties !== undefined || node.items !== undefined)
  ) {
    return true;
  }
  if (node.properties !== undefined && typeof node.properties === 'object') {
    return true;
  }
  return false;
}

/**
 * 深度遍历任意对象，提取最像 outputSchema 的节点
 * 优先命中：200.schema -> responses.schema -> schema(properties/items)
 */
export function extractOutputSchemaFromAny(raw: unknown): object | undefined {
  const root = asObject(raw);
  if (!root) return undefined;

  const visited = new Set<object>();
  const queue: Array<{ node: Record<string, unknown>; depth: number }> = [
    { node: root, depth: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const { node, depth } = current;
    if (visited.has(node)) continue;
    visited.add(node);

    // 1) 常见的 200.schema 结构
    const v200 = asObject(node['200']);
    if (v200) {
      const schema200 = asObject(v200.schema);
      if (schema200 && looksLikeSchemaNode(schema200)) {
        return {
          '200': {
            schema: schema200,
            description: v200.description ?? '接口成功响应体',
          },
        };
      }
    }

    // 2) 常见 responses / responseSchema / successResponseSchema
    const responses = asObject(
      node.responses ??
        node.responseSchema ??
        node.response_schema ??
        node.successResponseSchema ??
        node.success_response_schema,
    );
    if (responses) {
      const r200 = asObject(responses['200']);
      if (r200) {
        const r200Schema = asObject(r200.schema ?? r200.response ?? r200.body);
        if (r200Schema && looksLikeSchemaNode(r200Schema)) {
          return {
            '200': {
              schema: r200Schema,
              description: r200.description ?? '接口成功响应体',
            },
          };
        }
      }
      if (looksLikeSchemaNode(responses)) {
        return responses;
      }
      const nestedSchema = asObject(
        responses.schema ?? responses.response ?? responses.body,
      );
      if (nestedSchema && looksLikeSchemaNode(nestedSchema)) {
        return nestedSchema;
      }
    }

    // 3) 当前节点自身就是 schema
    if (looksLikeSchemaNode(node)) {
      return node;
    }
    const schema = asObject(node.schema);
    if (schema && looksLikeSchemaNode(schema)) {
      return schema;
    }

    if (depth >= 8) continue;
    for (const key of Object.keys(node)) {
      const child = asObject(node[key]);
      if (child) {
        queue.push({ node: child, depth: depth + 1 });
      }
    }
  }

  return undefined;
}

function createRowId(prefix: string, seed: string): string {
  return `${prefix}_${seed}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeOutputFieldType(
  value: unknown,
): ToolOutputSchemaField['type'] {
  const type = String(value ?? 'string').toLowerCase();
  if (
    type === 'string' ||
    type === 'number' ||
    type === 'integer' ||
    type === 'boolean' ||
    type === 'object' ||
    type === 'array' ||
    type === 'null'
  ) {
    return type;
  }
  return 'string';
}

function splitPath(path: string): string[] {
  return path
    .split('.')
    .map((token) => token.trim())
    .filter(Boolean);
}

function collectSchemaFields(
  statusCode: string,
  schemaNode: Record<string, unknown>,
  parentPath: string,
  inheritedRequired: boolean,
  collector: ToolOutputSchemaField[],
  skipSelfPush = false,
) {
  const nodeType = normalizeOutputFieldType(schemaNode.type);
  const currentPath = parentPath.trim();
  const description =
    typeof schemaNode.description === 'string' ? schemaNode.description : '';

  if (currentPath && !skipSelfPush) {
    collector.push({
      id: createRowId('output', `${statusCode}_${currentPath}`),
      statusCode,
      name: currentPath,
      type: nodeType,
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
    if (!properties) return;
    const requiredSet = new Set(
      Array.isArray(schemaNode.required)
        ? schemaNode.required.map((item) => String(item))
        : [],
    );
    Object.entries(properties).forEach(([key, value]) => {
      if (typeof value !== 'object' || value === null) return;
      const childPath = currentPath ? `${currentPath}.${key}` : key;
      collectSchemaFields(
        statusCode,
        value as Record<string, unknown>,
        childPath,
        requiredSet.has(key),
        collector,
      );
    });
    return;
  }

  if (nodeType === 'array') {
    const items =
      typeof schemaNode.items === 'object' && schemaNode.items !== null
        ? (schemaNode.items as Record<string, unknown>)
        : undefined;
    if (!items) return;
    collectSchemaFields(statusCode, items, currentPath, false, collector, true);
  }
}

export function normalizeOutputFieldPath(path: string): string {
  return path.trim().replace(/\[\]/g, '');
}

export function normalizeOutputSchemaFields(
  fields: ToolOutputSchemaField[],
): ToolOutputSchemaField[] {
  const byKey = new Map<string, ToolOutputSchemaField>();
  fields.forEach((field) => {
    const name = normalizeOutputFieldPath(field.name);
    if (!name) return;
    const key = `${field.statusCode}|${name}`;
    byKey.set(key, { ...field, name });
  });
  return Array.from(byKey.values());
}

export function outputSchemaToFields(schema?: object): ToolOutputSchemaField[] {
  if (!schema || typeof schema !== 'object') return [];
  const root = schema as Record<string, unknown>;
  const looksLikeStatusMap = Object.keys(root).some((key) =>
    /^\d{3}$/.test(key),
  );
  const rows: ToolOutputSchemaField[] = [];

  if (looksLikeStatusMap) {
    Object.entries(root).forEach(([statusCode, value]) => {
      const block =
        typeof value === 'object' && value !== null
          ? (value as Record<string, unknown>)
          : {};
      const schemaNode =
        typeof block.schema === 'object' && block.schema !== null
          ? (block.schema as Record<string, unknown>)
          : block;
      collectSchemaFields(statusCode, schemaNode, '', false, rows);
    });
    return normalizeOutputSchemaFields(rows);
  }

  const schemaNode =
    typeof root.schema === 'object' && root.schema !== null
      ? (root.schema as Record<string, unknown>)
      : root;
  collectSchemaFields('200', schemaNode, '', false, rows);
  return normalizeOutputSchemaFields(rows);
}

export function buildOutputSchemaFromFields(
  fields: ToolOutputSchemaField[],
): object | undefined {
  const valid = fields
    .map((field) => ({
      ...field,
      statusCode: field.statusCode.trim(),
      name: field.name.trim(),
      description: field.description.trim(),
    }))
    .filter((field) => field.statusCode.length > 0 && field.name.length > 0);
  if (valid.length === 0) return undefined;

  const grouped = new Map<string, ToolOutputSchemaField[]>();
  valid.forEach((field) => {
    const list = grouped.get(field.statusCode) ?? [];
    list.push(field);
    grouped.set(field.statusCode, list);
  });

  const result: Record<string, unknown> = {};
  grouped.forEach((items, statusCode) => {
    const rootSchema: Record<string, unknown> = {
      type: 'object',
      properties: {},
    };
    const fieldByPath = new Map<string, ToolOutputSchemaField>();
    items.forEach((field) =>
      fieldByPath.set(normalizeOutputFieldPath(field.name), field),
    );

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
        if (!existing.properties) existing.properties = {};
        return existing;
      }
      const created: Record<string, unknown> = {
        type: 'object',
        properties: {},
      };
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

    items.forEach((field) => {
      const tokens = splitPath(normalizeOutputFieldPath(field.name));
      if (tokens.length === 0) return;

      let node = rootSchema;
      for (let i = 0; i < tokens.length; i += 1) {
        const key = tokens[i];
        const isLeaf = i === tokens.length - 1;
        const pathSoFar = tokens.slice(0, i + 1).join('.');
        const segmentField = fieldByPath.get(pathSoFar);
        const isArraySegment = segmentField?.type === 'array';

        if (!isLeaf) {
          if (isArraySegment) {
            const arrayNode = ensureArrayNode(node, key);
            node =
              typeof arrayNode.items === 'object' && arrayNode.items !== null
                ? (arrayNode.items as Record<string, unknown>)
                : { type: 'object', properties: {} };
            if (!arrayNode.items) arrayNode.items = node;
            if (node.type !== 'object') node.type = 'object';
            if (!node.properties) node.properties = {};
          } else {
            node = ensureObjectNode(node, key);
          }
          continue;
        }

        const properties = (node.properties ?? {}) as Record<string, unknown>;
        const leafSchema: Record<string, unknown> = { type: field.type };
        if (field.description) leafSchema.description = field.description;
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
          if (!req.includes(key)) req.push(key);
          node.required = req;
        }
      }
    });

    result[statusCode] = {
      schema: rootSchema,
      description: '接口成功响应体',
    };
  });

  if (Object.keys(result).length === 1 && result['200']) {
    const node = result['200'] as Record<string, unknown>;
    return node.schema as object;
  }
  return result;
}

function profileFieldToRow(
  item: import('@/types/tool').ToolCoreField,
  index: number,
): ToolCoreFieldRow {
  if (typeof item === 'string') {
    return {
      id: createRowId('profile', String(index)),
      path: item,
      label: '',
      description: '',
      keywords: [],
    };
  }

  if (typeof item === 'object' && item !== null) {
    const obj = item as Record<string, unknown>;
    const keywordsRaw = obj.keywords ?? obj.keyword;
    let keywords: string[] = [];
    if (Array.isArray(keywordsRaw)) {
      keywords = keywordsRaw
        .map((value) => String(value).trim())
        .filter(Boolean);
    } else if (typeof keywordsRaw === 'string' && keywordsRaw.trim()) {
      keywords = keywordsRaw
        .split(/[,，]/)
        .map((value) => value.trim())
        .filter(Boolean);
    }

    return {
      id: createRowId('profile', String(index)),
      path: String(obj.path ?? ''),
      label: typeof obj.label === 'string' ? obj.label : '',
      description: typeof obj.description === 'string' ? obj.description : '',
      keywords,
    };
  }

  return {
    id: createRowId('profile', String(index)),
    path: JSON.stringify(item),
    label: '',
    description: '',
    keywords: [],
  };
}

export function profileFieldsToRows(
  fields: import('@/types/tool').ToolResponseProfile['coreFields'],
): ToolCoreFieldRow[] {
  if (!Array.isArray(fields)) return [];
  return fields.map((item, index) => profileFieldToRow(item, index));
}

export function rowsToProfileFields(
  rows: ToolCoreFieldRow[],
  options?: { includeKeywords?: boolean },
): import('@/types/tool').ToolResponseProfile['coreFields'] {
  const includeKeywords = options?.includeKeywords ?? false;
  const result: NonNullable<
    import('@/types/tool').ToolResponseProfile['coreFields']
  > = [];

  rows.forEach((row) => {
    const path = row.path.trim();
    if (!path) return;

    const label = row.label.trim();
    const description = row.description.trim();
    const keywords = (row.keywords ?? [])
      .map((value) => value.trim())
      .filter(Boolean);
    const hasMeta = Boolean(
      label || description || (includeKeywords && keywords.length > 0),
    );

    if (!hasMeta) {
      result.push(path);
      return;
    }

    const obj: import('@/types/tool').ToolProfileField = { path };
    if (label) obj.label = label;
    if (description) obj.description = description;
    if (includeKeywords && keywords.length > 0) obj.keywords = keywords;
    result.push(obj);
  });

  return result.length ? result : undefined;
}

export function rowsToListMetaFields(
  rows: ToolCoreFieldRow[],
): import('@/types/tool').ToolProfileField[] | undefined {
  const result: import('@/types/tool').ToolProfileField[] = [];

  rows.forEach((row) => {
    const path = row.path.trim();
    if (!path) return;

    const field: import('@/types/tool').ToolProfileField = { path };
    const label = row.label.trim();
    const description = row.description.trim();
    if (label) field.label = label;
    if (description) field.description = description;
    result.push(field);
  });

  return result.length ? result : undefined;
}

/** @deprecated use profileFieldsToRows */
export function coreFieldsToRows(
  coreFields: import('@/types/tool').ToolResponseProfile['coreFields'],
): ToolCoreFieldRow[] {
  return profileFieldsToRows(coreFields);
}

/** @deprecated use rowsToProfileFields */
export function rowsToCoreFields(
  rows: ToolCoreFieldRow[],
): import('@/types/tool').ToolResponseProfile['coreFields'] {
  return rowsToProfileFields(rows);
}

export function buildCreateToolPayload(
  projectId: number,
  values: ToolFormValues,
): CreateToolDto {
  const schemaFields = buildSchemaFields(values.parameters ?? []);
  const agentMetadata = buildAgentMetadataForPersist(values.agentMetadata);

  return {
    appClientId: projectId,
    name: values.name.trim(),
    description: values.description.trim(),
    method: values.method,
    path: values.path.trim(),
    integrationId: values.integrationId,
    riskLevel: values.riskLevel,
    isActive: values.isActive,
    ...(agentMetadata ? { agentMetadata } : {}),
    ...schemaFields,
  };
}

export function buildUpdateToolPayload(
  values: ToolFormValues,
  responseFields?: {
    outputSchema?: object;
    responseProfile?: ToolResponseProfile;
  },
): UpdateToolDto {
  const schemaFields = buildSchemaFields(values.parameters ?? []);
  const agentMetadata = buildAgentMetadataForPersist(values.agentMetadata);

  return {
    name: values.name.trim(),
    description: values.description.trim(),
    method: values.method,
    path: values.path.trim(),
    integrationId: values.integrationId,
    riskLevel: values.riskLevel,
    isActive: values.isActive,
    outputSchema: responseFields?.outputSchema,
    responseProfile: responseFields?.responseProfile,
    agentMetadata: agentMetadata ?? null,
    ...schemaFields,
  };
}

export function useTools(): UseToolsResult {
  const intl = useIntl();
  const { projectId } = useProjectRoute();
  const [tools, setTools] = useState<Tool[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importIntegrations, setImportIntegrations] = useState<Integration[]>(
    [],
  );
  const [importIntegrationsLoading, setImportIntegrationsLoading] =
    useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, projectId]);

  useEffect(() => {
    setSelectedIds([]);
  }, [debouncedKeyword, page, pageSize, projectId]);

  const loadTools = useCallback(async () => {
    if (!projectId) {
      setTools([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const result = await ToolController_findPage({
        appClientId: projectId,
        page,
        pageSize,
        keyword: debouncedKeyword || undefined,
        orderBy: 'updatedAt',
        order: 'desc',
      });
      setTools(result.list);
      setTotal(result.total);

      const maxPage = Math.max(1, Math.ceil(result.total / pageSize) || 1);
      if (page > maxPage) {
        setPage(maxPage);
      }
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'tool.loadFailed' }),
      );
      setTools([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, intl, page, pageSize, projectId]);

  useEffect(() => {
    void loadTools();
  }, [loadTools]);

  const onPageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  };

  const isSearchActive = debouncedKeyword.length > 0;
  const showEmpty = Boolean(projectId) && !loading && total === 0;
  const showPagination = Boolean(projectId) && total > 0;

  const summaryText = useMemo(() => {
    if (!projectId) {
      return null;
    }
    if (loading) {
      return null;
    }
    if (isSearchActive && total === 0) {
      return intl.formatMessage({ id: 'tool.summary.searchNone' });
    }
    if (isSearchActive) {
      return intl.formatMessage({ id: 'tool.summary.searchFound' }, { total });
    }
    return intl.formatMessage({ id: 'tool.summary.total' }, { total });
  }, [intl, isSearchActive, loading, projectId, total]);

  const toDetailPath = (toolId: number) => `/tool/detail/${toolId}`;

  const openCreate = () => {
    history.push('/tool/detail/create');
  };

  const openConfigure = (tool: Tool) => {
    history.push(toDetailPath(tool.id));
  };

  const handleDelete = async (id: number) => {
    try {
      await ToolController_remove(id);
      message.success(intl.formatMessage({ id: 'tool.deleted' }));
      if (tools.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadTools();
      }
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'tool.deleteFailed' }),
      );
    }
  };

  const handleToggleActive = async (tool: Tool) => {
    try {
      await ToolController_update(tool.id, { isActive: !tool.isActive });
      message.success(
        intl.formatMessage({
          id: tool.isActive ? 'tool.disabled' : 'tool.enabled',
        }),
      );
      await loadTools();
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'tool.actionFailed' }),
      );
    }
  };

  const currentPageIds = useMemo(() => tools.map((tool) => tool.id), [tools]);

  const selectedCount = selectedIds.length;

  const isAllCurrentPageSelected = useMemo(() => {
    if (currentPageIds.length === 0) {
      return false;
    }
    return currentPageIds.every((id) => selectedIds.includes(id));
  }, [currentPageIds, selectedIds]);

  const isSelectionIndeterminate = useMemo(() => {
    if (currentPageIds.length === 0 || isAllCurrentPageSelected) {
      return false;
    }
    return currentPageIds.some((id) => selectedIds.includes(id));
  }, [currentPageIds, isAllCurrentPageSelected, selectedIds]);

  const toggleSelect = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const toggleSelectAllCurrentPage = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id)),
      );
      return;
    }

    setSelectedIds((prev) => {
      const merged = new Set([...prev, ...currentPageIds]);
      return Array.from(merged);
    });
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const runBatchSetActive = async (isActive: boolean) => {
    if (selectedIds.length === 0) {
      return;
    }

    setBatchSubmitting(true);
    try {
      const result = await ToolController_batchSetActive({
        ids: selectedIds,
        isActive,
      });
      const notFoundCount = result.notFoundIds?.length ?? 0;
      const succeeded =
        result.updatedCount ?? Math.max(0, selectedIds.length - notFoundCount);
      const failed = notFoundCount;

      if (failed === 0) {
        message.success(
          intl.formatMessage(
            { id: isActive ? 'tool.batch.enabled' : 'tool.batch.disabled' },
            { count: succeeded },
          ),
        );
      } else if (succeeded > 0) {
        message.warning(
          intl.formatMessage(
            { id: 'tool.batch.partial' },
            { succeeded, failed, total: selectedIds.length },
          ),
        );
      } else {
        message.error(intl.formatMessage({ id: 'tool.actionFailed' }));
      }

      clearSelection();
      await loadTools();
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'tool.actionFailed' }),
      );
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleBatchEnable = () => runBatchSetActive(true);
  const handleBatchDisable = () => runBatchSetActive(false);

  const loadImportIntegrations = useCallback(async () => {
    if (!projectId) {
      setImportIntegrations([]);
      return;
    }

    setImportIntegrationsLoading(true);
    try {
      const result = await IntegrationController_findByAppClient(projectId, {
        page: 1,
        pageSize: 100,
        orderBy: 'name',
        order: 'asc',
      });
      setImportIntegrations(result.list);
    } catch {
      setImportIntegrations([]);
    } finally {
      setImportIntegrationsLoading(false);
    }
  }, [projectId]);

  const openImportModal = () => {
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'tool.selectProject' }));
      return;
    }
    setImportModalOpen(true);
    void loadImportIntegrations();
  };

  const onImportModalOpenChange = (open: boolean) => {
    setImportModalOpen(open);
    if (open && projectId) {
      void loadImportIntegrations();
    }
  };

  const handleImportFromSwagger = async (
    values: ImportToolsFromSwaggerFormValues,
  ): Promise<boolean> => {
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'tool.selectProject' }));
      return false;
    }

    if (values.integrationMode === 'existing' && !values.integrationId) {
      message.error(
        intl.formatMessage({ id: 'tool.form.integrationRequired' }),
      );
      return false;
    }

    setImportSubmitting(true);
    try {
      const payload = buildImportToolsFromSwaggerDto(projectId, values);
      await ToolController_importFromSwagger(payload);
      message.success(
        intl.formatMessage({
          id: values.dryRun
            ? 'tool.import.dryRunSuccess'
            : 'tool.import.success',
        }),
      );
      if (!values.dryRun) {
        setPage(1);
        await loadTools();
      }
      return true;
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'tool.import.failed' }),
      );
      return false;
    } finally {
      setImportSubmitting(false);
    }
  };

  return {
    projectId,
    tools,
    loading,
    keyword,
    page,
    pageSize,
    total,
    isSearchActive,
    summaryText,
    showEmpty,
    showPagination,
    setKeyword,
    onPageChange,
    openCreate,
    openConfigure,
    handleDelete,
    handleToggleActive,
    selectedIds,
    selectedCount,
    isAllCurrentPageSelected,
    isSelectionIndeterminate,
    batchSubmitting,
    toggleSelect,
    toggleSelectAllCurrentPage,
    clearSelection,
    handleBatchEnable,
    handleBatchDisable,
    toDetailPath,
    importModalOpen,
    importSubmitting,
    importIntegrations,
    importIntegrationsLoading,
    openImportModal,
    onImportModalOpenChange,
    handleImportFromSwagger,
  };
}
