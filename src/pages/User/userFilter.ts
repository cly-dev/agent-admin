export type UserFilterFormValues = {
  keyword?: string;
  id?: number;
  email?: string;
  username?: string;
  employeeId?: string;
};

export type UserFilterValues = {
  keyword?: string;
  id?: number;
  email?: string;
  username?: string;
  employeeId?: string;
};

export function normalizeUserFilter(
  values: UserFilterFormValues,
): UserFilterValues {
  return {
    keyword: values.keyword?.trim() || undefined,
    id: values.id,
    email: values.email?.trim() || undefined,
    username: values.username?.trim() || undefined,
    employeeId: values.employeeId?.trim() || undefined,
  };
}

export function countActiveUserFilters(filters: UserFilterValues): number {
  return Object.values(filters).filter(
    (value) => value !== undefined && value !== '',
  ).length;
}
