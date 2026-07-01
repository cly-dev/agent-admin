export type PageActionFilterFormValues = {
  keyword?: string;
  pageScope?: string;
  isActive?: string;
};

export type PageActionFilterValues = {
  keyword?: string;
  pageScope?: string;
  isActive?: boolean;
};

export function normalizePageActionFilter(
  values: PageActionFilterFormValues,
): PageActionFilterValues {
  const filters: PageActionFilterValues = {};
  const keyword = values.keyword?.trim();
  const pageScope = values.pageScope?.trim();

  if (keyword) {
    filters.keyword = keyword;
  }
  if (pageScope) {
    filters.pageScope = pageScope;
  }
  if (values.isActive === 'true') {
    filters.isActive = true;
  } else if (values.isActive === 'false') {
    filters.isActive = false;
  }

  return filters;
}

export function countActivePageActionFilters(
  filters: PageActionFilterValues,
): number {
  let count = 0;
  if (filters.keyword) {
    count += 1;
  }
  if (filters.pageScope) {
    count += 1;
  }
  if (filters.isActive !== undefined) {
    count += 1;
  }
  return count;
}
