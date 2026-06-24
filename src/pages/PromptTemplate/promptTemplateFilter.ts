import type { PromptTemplateControllerFindPageParams } from '@/types/prompt-template';

export type PromptTemplateFilterFormValues = {
  keyword?: string;
  key?: string;
  locale?: string;
  appClientId?: number;
  agentId?: number;
  isActive?: '' | 'true' | 'false';
};

export type PromptTemplateFilterValues = Pick<
  PromptTemplateControllerFindPageParams,
  'key' | 'locale' | 'appClientId' | 'agentId' | 'isActive'
>;

export function normalizePromptTemplateFilter(
  values: PromptTemplateFilterFormValues,
): PromptTemplateFilterValues {
  const filters: PromptTemplateFilterValues = {};

  const key = values.key?.trim() || values.keyword?.trim();
  if (key) {
    filters.key = key;
  }

  const locale = values.locale?.trim();
  if (locale) {
    filters.locale = locale;
  }

  if (
    typeof values.appClientId === 'number' &&
    Number.isFinite(values.appClientId) &&
    values.appClientId > 0
  ) {
    filters.appClientId = values.appClientId;
  }

  if (
    typeof values.agentId === 'number' &&
    Number.isFinite(values.agentId) &&
    values.agentId > 0
  ) {
    filters.agentId = values.agentId;
  }

  if (values.isActive === 'true') {
    filters.isActive = true;
  } else if (values.isActive === 'false') {
    filters.isActive = false;
  }

  return filters;
}

export function countActivePromptTemplateFilters(
  filters: PromptTemplateFilterValues,
): number {
  let count = 0;
  if (filters.key) count += 1;
  if (filters.locale) count += 1;
  if (filters.appClientId) count += 1;
  if (filters.agentId) count += 1;
  if (filters.isActive !== undefined) count += 1;
  return count;
}
