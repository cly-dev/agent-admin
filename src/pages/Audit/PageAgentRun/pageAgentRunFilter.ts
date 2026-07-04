import type { PageAgentLlmProxyAuditStatus } from '@/types/page-agent-llm-proxy-audit';

export type PageAgentRunFilterFormValues = {
  keyword?: string;
  status?: PageAgentLlmProxyAuditStatus | '';
  userId?: number;
  modelConfigId?: number;
  upstreamStatus?: number;
};

export type PageAgentRunFilterValues = {
  status?: PageAgentLlmProxyAuditStatus;
  userId?: number;
  modelConfigId?: number;
  upstreamStatus?: number;
};

function normalizePositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

export function normalizePageAgentRunFilter(
  values: PageAgentRunFilterFormValues,
): PageAgentRunFilterValues {
  return {
    status: values.status || undefined,
    userId: normalizePositiveNumber(values.userId),
    modelConfigId: normalizePositiveNumber(values.modelConfigId),
    upstreamStatus:
      typeof values.upstreamStatus === 'number' &&
      Number.isFinite(values.upstreamStatus)
        ? values.upstreamStatus
        : undefined,
  };
}

export function countActivePageAgentRunFilters(
  filters: PageAgentRunFilterValues,
): number {
  let count = 0;
  if (filters.status) count += 1;
  if (filters.userId !== undefined) count += 1;
  if (filters.modelConfigId !== undefined) count += 1;
  if (filters.upstreamStatus !== undefined) count += 1;
  return count;
}
