import type { SessionControllerFindPageParams } from '@/types/session';

export type ChatFilterValues = {
  keyword?: string;
  id?: string;
  userId?: number;
  agentId?: number;
  title?: string;
};

export type ChatFilterFormValues = {
  keyword?: string;
  id?: string;
  userId?: number;
  agentId?: number;
  title?: string;
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

export function normalizeChatFilter(values: ChatFilterFormValues): ChatFilterValues {
  return {
    keyword: trimOptionalString(values.keyword),
    id: trimOptionalString(values.id),
    userId: finiteNumber(values.userId),
    agentId: finiteNumber(values.agentId),
    title: trimOptionalString(values.title),
  };
}

export function buildSessionQuery(
  filters: ChatFilterValues,
  pagination: Pick<SessionControllerFindPageParams, 'page' | 'pageSize' | 'orderBy' | 'order'>,
): SessionControllerFindPageParams {
  return {
    ...pagination,
    ...filters,
  };
}

export function countActiveChatFilters(filters: ChatFilterValues): number {
  return Object.values(filters).filter((value) => value !== undefined).length;
}
