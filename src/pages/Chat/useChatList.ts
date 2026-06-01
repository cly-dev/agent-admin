import { useProjectRoute } from '@/hooks/useProjectRoute';
import { SessionController_findPage } from '@/services/session';
import type { Session } from '@/types/session';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  buildSessionQuery,
  normalizeChatFilter,
  type ChatFilterFormValues,
  type ChatFilterValues,
} from './chatFilter';

const DEFAULT_PAGE_SIZE = 20;

export type ChatListItem = Session;

export function useChatList() {
  const intl = useIntl();
  const { projectId, toPagePath } = useProjectRoute();
  const [filterForm] = Form.useForm<ChatFilterFormValues>();
  const [appliedFilters, setAppliedFilters] = useState<ChatFilterValues>({});
  const [list, setList] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const loadList = useCallback(
    async (targetPage: number, targetPageSize: number, filters: ChatFilterValues) => {
      if (!projectId) {
        setList([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      try {
        const result = await SessionController_findPage(
          projectId,
          buildSessionQuery(filters, {
            page: targetPage,
            pageSize: targetPageSize,
            orderBy: 'updatedAt',
            order: 'desc',
          }),
        );
        setList(result.list);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : intl.formatMessage({ id: 'chat.loadFailed' }),
        );
        setList([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [intl, projectId],
  );

  useEffect(() => {
    if (!projectId) {
      setList([]);
      setTotal(0);
      filterForm.resetFields();
      setAppliedFilters({});
      return;
    }

    filterForm.resetFields();
    setAppliedFilters({});
    setPage(1);
    void loadList(1, DEFAULT_PAGE_SIZE, {});
  }, [filterForm, loadList, projectId]);

  const handleFilterSearch = (values: ChatFilterFormValues) => {
    const filters = normalizeChatFilter(values);
    setAppliedFilters(filters);
    setPage(1);
    void loadList(1, pageSize, filters);
  };

  const handleFilterReset = () => {
    filterForm.resetFields();
    setAppliedFilters({});
    setPage(1);
    void loadList(1, pageSize, {});
  };

  const onPageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
    void loadList(nextPage, nextPageSize, appliedFilters);
  };

  const detailPath = (id: string) => toPagePath('chat', `detail/${id}`);

  return {
    projectId,
    filterForm,
    appliedFilters,
    list,
    loading,
    page,
    pageSize,
    total,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    detailPath,
  };
}
