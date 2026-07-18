import type { FlowProfile } from '@/types/flow';

export type FlowFilterFormValues = {
  keyword?: string;
  profile?: FlowProfile;
  isActive?: '' | 'true' | 'false';
};

export type FlowFilterValues = {
  keyword?: string;
  profile?: FlowProfile;
  isActive?: boolean;
};

export function normalizeFlowFilter(
  values: FlowFilterFormValues,
): FlowFilterValues {
  const keyword = values.keyword?.trim();
  const filters: FlowFilterValues = {
    ...(keyword ? { keyword } : {}),
    ...(values.profile ? { profile: values.profile } : {}),
  };
  if (values.isActive === 'true') {
    filters.isActive = true;
  } else if (values.isActive === 'false') {
    filters.isActive = false;
  }
  return filters;
}

export function countActiveFlowFilters(filters: FlowFilterValues): number {
  let count = 0;
  if (filters.keyword) {
    count += 1;
  }
  if (filters.profile) {
    count += 1;
  }
  if (filters.isActive !== undefined) {
    count += 1;
  }
  return count;
}
