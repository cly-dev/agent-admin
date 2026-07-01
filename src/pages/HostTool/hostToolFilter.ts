export type HostToolFilterFormValues = {
  keyword?: string;
  isActive?: boolean | string;
};

export type HostToolFilterValues = {
  keyword?: string;
  isActive?: boolean;
};

export function normalizeHostToolFilter(
  values: HostToolFilterFormValues,
): HostToolFilterValues {
  const keyword = values.keyword?.trim();
  const isActiveRaw = values.isActive;
  let isActive: boolean | undefined;
  if (isActiveRaw === true || isActiveRaw === 'true') {
    isActive = true;
  } else if (isActiveRaw === false || isActiveRaw === 'false') {
    isActive = false;
  }
  return {
    keyword: keyword || undefined,
    isActive,
  };
}

export function countActiveHostToolFilters(
  filters: HostToolFilterValues,
): number {
  let count = 0;
  if (filters.isActive !== undefined) {
    count += 1;
  }
  return count;
}
