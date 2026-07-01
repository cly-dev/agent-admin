import type { WorkflowProfile } from '@/types/workflow';

export type WorkflowFilterFormValues = {
  keyword?: string;
  profile?: WorkflowProfile;
  isActive?: '' | 'true' | 'false';
};

export type WorkflowFilterValues = {
  keyword?: string;
  profile?: WorkflowProfile;
  isActive?: boolean;
};

export function normalizeWorkflowFilter(
  values: WorkflowFilterFormValues,
): WorkflowFilterValues {
  const keyword = values.keyword?.trim();
  const filters: WorkflowFilterValues = {
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

export function countActiveWorkflowFilters(filters: WorkflowFilterValues): number {
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
