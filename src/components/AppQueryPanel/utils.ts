/** 统计已生效的筛选项数量（忽略 undefined / null / 空字符串） */
export function countActiveFilters(filters: Record<string, unknown>): number {
  return Object.values(filters).filter((value) => {
    if (value === undefined || value === null) {
      return false;
    }
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return true;
  }).length;
}
