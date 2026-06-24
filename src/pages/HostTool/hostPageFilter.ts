export type HostPageFilterFormValues = {
  keyword?: string;
  scope?: string;
  isActive?: boolean | string;
};

export type HostPageFilterValues = {
  keyword?: string;
  scope?: string;
  isActive?: boolean;
};

export function normalizeHostPageFilter(
  values: HostPageFilterFormValues,
): HostPageFilterValues {
  const keyword = values.keyword?.trim();
  const scope = values.scope?.trim();
  const isActiveRaw = values.isActive;
  let isActive: boolean | undefined;
  if (isActiveRaw === true || isActiveRaw === 'true') {
    isActive = true;
  } else if (isActiveRaw === false || isActiveRaw === 'false') {
    isActive = false;
  }
  return {
    keyword: keyword || undefined,
    scope: scope || undefined,
    isActive,
  };
}

export function countActiveHostPageFilters(
  filters: HostPageFilterValues,
): number {
  let count = 0;
  if (filters.scope) {
    count += 1;
  }
  if (filters.isActive !== undefined) {
    count += 1;
  }
  return count;
}
