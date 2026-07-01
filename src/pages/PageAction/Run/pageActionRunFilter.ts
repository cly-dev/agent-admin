import type { PageActionRunStatus } from '@/types/page-action-run';

export type PageActionRunFilterFormValues = {
  actionKey?: string;
  status?: PageActionRunStatus | '';
  userId?: number;
  clientActionId?: string;
  pageActionId?: number;
};

export type PageActionRunFilterValues = {
  actionKey?: string;
  status?: PageActionRunStatus;
  userId?: number;
  clientActionId?: string;
  pageActionId?: number;
};

export function normalizePageActionRunFilter(
  values: PageActionRunFilterFormValues,
): PageActionRunFilterValues {
  const actionKey = values.actionKey?.trim();
  const clientActionId = values.clientActionId?.trim();
  const userId =
    typeof values.userId === 'number' && Number.isFinite(values.userId)
      ? values.userId
      : undefined;
  const pageActionId =
    typeof values.pageActionId === 'number' && Number.isFinite(values.pageActionId)
      ? values.pageActionId
      : undefined;

  return {
    actionKey: actionKey || undefined,
    status: values.status || undefined,
    userId,
    clientActionId: clientActionId || undefined,
    pageActionId,
  };
}

export function countActivePageActionRunFilters(
  filters: PageActionRunFilterValues,
): number {
  let count = 0;
  if (filters.actionKey) {
    count += 1;
  }
  if (filters.status) {
    count += 1;
  }
  if (filters.userId !== undefined) {
    count += 1;
  }
  if (filters.clientActionId) {
    count += 1;
  }
  if (filters.pageActionId !== undefined) {
    count += 1;
  }
  return count;
}
