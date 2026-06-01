import type { AgentRunControllerFindPageParams } from '@/types/agent-run';

export type AgentRunFilterValues = {
  keyword?: string;
  id?: number;
  turnId?: number;
  agentId?: number;
  sessionId?: string;
  userId?: number;
  role?: AgentRunControllerFindPageParams['role'];
  status?: AgentRunControllerFindPageParams['status'];
  input?: string;
};

export type AgentRunFilterFormValues = {
  keyword?: string;
  id?: number;
  turnId?: number;
  agentId?: number;
  sessionId?: string;
  userId?: number;
  role?: AgentRunControllerFindPageParams['role'] | '';
  status?: AgentRunControllerFindPageParams['status'] | '';
  input?: string;
};

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

export function normalizeAgentRunFilter(values: AgentRunFilterFormValues): AgentRunFilterValues {
  const filters: AgentRunFilterValues = {
    keyword: trimOptionalString(values.keyword),
    id: finiteNumber(values.id),
    turnId: finiteNumber(values.turnId),
    agentId: finiteNumber(values.agentId),
    sessionId: trimOptionalString(values.sessionId),
    userId: finiteNumber(values.userId),
    input: trimOptionalString(values.input),
  };

  if (
    values.role === 'primary' ||
    values.role === 'router' ||
    values.role === 'worker' ||
    values.role === 'reviewer'
  ) {
    filters.role = values.role;
  }

  if (values.status === 'running' || values.status === 'success' || values.status === 'failed') {
    filters.status = values.status;
  }

  return filters;
}

export function countActiveAgentRunFilters(filters: AgentRunFilterValues): number {
  return Object.values(filters).filter((value) => value !== undefined).length;
}
