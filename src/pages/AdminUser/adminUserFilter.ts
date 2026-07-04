import type { AdminRole } from '@/types/admin-user';

export type AdminUserFilterFormValues = {
  keyword?: string;
  role?: AdminRole;
  isActive?: boolean;
};

export type AdminUserFilterValues = {
  keyword?: string;
  role?: AdminRole;
  isActive?: boolean;
};

export function normalizeAdminUserFilter(
  values: AdminUserFilterFormValues,
): AdminUserFilterValues {
  const keyword = values.keyword?.trim();
  return {
    keyword: keyword || undefined,
    role: values.role,
    isActive: values.isActive,
  };
}

export function countActiveAdminUserFilters(
  filters: Record<string, unknown>,
): number {
  let count = 0;
  if (filters.keyword) count += 1;
  if (filters.role) count += 1;
  if (filters.isActive !== undefined && filters.isActive !== null) count += 1;
  return count;
}
