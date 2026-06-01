import type { PageResult } from '@/types/integration';

export function normalizePageResult<T>(
  raw: unknown,
  normalizeItem: (item: unknown) => T,
): PageResult<T> {
  if (Array.isArray(raw)) {
    const list = raw.map(normalizeItem);
    return {
      list,
      total: list.length,
      page: 1,
      pageSize: list.length,
    };
  }

  if (typeof raw !== 'object' || raw === null) {
    return { list: [], total: 0, page: 1, pageSize: 0 };
  }

  const payload = raw as Record<string, unknown>;
  const nestedData =
    typeof payload.data === 'object' && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : null;
  const source = nestedData ?? payload;

  const listRaw = source.list ?? source.items ?? source.records ?? source.rows ?? [];
  const list = Array.isArray(listRaw) ? listRaw.map(normalizeItem) : [];

  const total = Number(source.total ?? source.count ?? list.length);
  const page = Number(source.page ?? 1);
  const pageSize = Number(source.pageSize ?? source.page_size ?? list.length);
  const totalPagesRaw = source.totalPages ?? source.total_pages;

  return {
    list,
    total,
    page,
    pageSize,
    totalPages:
      typeof totalPagesRaw === 'number' && Number.isFinite(totalPagesRaw)
        ? totalPagesRaw
        : pageSize > 0
          ? Math.max(1, Math.ceil(total / pageSize))
          : 1,
  };
}
