import type { AgentControllerGetAgentToolsParams } from '@/types/agent';
import type { ToolHttpMethod, ToolRiskLevel } from '@/types/tool';

export type AgentBoundToolsFilterValues = {
  keyword?: string;
  /** 绑定记录 ID */
  id?: number;
  /** Tool ID（精确） */
  toolId?: number;
  definitionKey?: string;
  integrationId?: number;
  toolCategoryId?: number;
  toolCategoryIdIsNull?: boolean;
  name?: string;
  description?: string;
  path?: string;
  riskLevel?: ToolRiskLevel;
  method?: ToolHttpMethod;
  isActive?: boolean;
};

/** 表单中的三态字段：未选 / 是 / 否 */
export type TriStateOption = '' | 'true' | 'false';

export type AgentBoundToolsFilterFormValues = {
  keyword?: string;
  id?: number;
  toolId?: number;
  definitionKey?: string;
  integrationId?: number;
  toolCategoryId?: number;
  toolCategoryIdIsNull?: TriStateOption;
  name?: string;
  description?: string;
  path?: string;
  riskLevel?: ToolRiskLevel | '';
  method?: ToolHttpMethod | '';
  isActive?: TriStateOption;
};

function parseTriState(value: TriStateOption | undefined): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function trimOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export function normalizeAgentBoundToolsFilter(
  values: AgentBoundToolsFilterFormValues,
): AgentBoundToolsFilterValues {
  const filters: AgentBoundToolsFilterValues = {
    keyword: trimOptionalString(values.keyword),
    id: finiteNumber(values.id),
    toolId: finiteNumber(values.toolId),
    definitionKey: trimOptionalString(values.definitionKey),
    integrationId: finiteNumber(values.integrationId),
    toolCategoryId: finiteNumber(values.toolCategoryId),
    toolCategoryIdIsNull: parseTriState(values.toolCategoryIdIsNull),
    name: trimOptionalString(values.name),
    description: trimOptionalString(values.description),
    path: trimOptionalString(values.path),
    isActive: parseTriState(values.isActive),
  };

  if (values.riskLevel === 'L1' || values.riskLevel === 'L2' || values.riskLevel === 'L3') {
    filters.riskLevel = values.riskLevel;
  }

  if (
    values.method === 'Get' ||
    values.method === 'Post' ||
    values.method === 'Put' ||
    values.method === 'Delete'
  ) {
    filters.method = values.method;
  }

  return filters;
}

export function buildAgentGetToolsQuery(
  filters: AgentBoundToolsFilterValues,
  pagination: Pick<AgentControllerGetAgentToolsParams, 'page' | 'pageSize' | 'orderBy' | 'order'>,
): AgentControllerGetAgentToolsParams {
  return {
    ...pagination,
    ...filters,
  };
}

export function countActiveAgentBoundToolsFilters(filters: AgentBoundToolsFilterValues): number {
  return Object.values(filters).filter((value) => value !== undefined).length;
}
