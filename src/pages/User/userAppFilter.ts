export type UserAppFilterFormValues = {
  keyword?: string;
  id?: number;
  userId?: number;
  appId?: number;
  roleId?: number;
};

export type UserAppFilterValues = {
  keyword?: string;
  id?: number;
  userId?: number;
  appId?: number;
  roleId?: number;
};

export function normalizeUserAppFilter(values: UserAppFilterFormValues): UserAppFilterValues {
  return {
    keyword: values.keyword?.trim() || undefined,
    id: values.id,
    userId: values.userId,
    appId: values.appId,
    roleId: values.roleId,
  };
}

export function countActiveUserAppFilters(filters: UserAppFilterValues): number {
  return Object.values(filters).filter((value) => value !== undefined && value !== '').length;
}
