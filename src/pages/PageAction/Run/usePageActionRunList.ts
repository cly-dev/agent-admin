import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import { PageActionRunController_findByAppClient } from '@/services/page-action-run';
import type { PageActionRunListItem } from '@/types/page-action-run';
import { history, useIntl, useSearchParams } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  normalizePageActionRunFilter,
  type PageActionRunFilterFormValues,
  type PageActionRunFilterValues,
} from './pageActionRunFilter';
import { PAGE_ACTION_RUN_LIST_PATH } from './pageActionRunDisplay';

export function usePageActionRunList() {
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const { projectId, toPagePath } = useProjectRoute();
  const [filterForm] = Form.useForm<PageActionRunFilterFormValues>();

  const initialPageActionId = useMemo(() => {
    const raw = searchParams.get('pageActionId');
    if (!raw) {
      return undefined;
    }
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : undefined;
  }, [searchParams]);

  const [appliedFilters, setAppliedFilters] = useState<PageActionRunFilterValues>(
    () => (initialPageActionId ? { pageActionId: initialPageActionId } : {}),
  );
  const [list, setList] = useState<PageActionRunListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const loadList = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      filters: PageActionRunFilterValues,
    ) => {
      if (!projectId) {
        setList([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      try {
        const result = await PageActionRunController_findByAppClient(projectId, {
          page: targetPage,
          pageSize: targetPageSize,
          ...filters,
        });
        setList(result.list);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : intl.formatMessage({ id: 'pageActionRun.loadFailed' }),
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

    const initialFilters = initialPageActionId
      ? { pageActionId: initialPageActionId }
      : {};
    filterForm.setFieldsValue({
      pageActionId: initialPageActionId,
    });
    setAppliedFilters(initialFilters);
    setPage(1);
    void loadList(1, DEFAULT_PAGE_SIZE, initialFilters);
  }, [filterForm, initialPageActionId, loadList, projectId]);

  const handleFilterSearch = (values: PageActionRunFilterFormValues) => {
    const filters = normalizePageActionRunFilter(values);
    setAppliedFilters(filters);
    setPage(1);
    void loadList(1, pageSize, filters);
  };

  const handleFilterReset = () => {
    filterForm.resetFields();
    setAppliedFilters({});
    setPage(1);
    if (searchParams.get('pageActionId')) {
      history.replace(PAGE_ACTION_RUN_LIST_PATH);
    }
    void loadList(1, pageSize, {});
  };

  const onPageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
    void loadList(nextPage, nextPageSize, appliedFilters);
  };

  const runDetailPath = (id: number) =>
    toPagePath('workflow', `page-action-run/detail/${id}`);

  const configListPath = () => toPagePath('workflow', 'frontend-tool-flow');

  return {
    projectId,
    filterForm,
    appliedFilters,
    list,
    loading,
    page,
    pageSize,
    total,
    initialPageActionId,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    runDetailPath,
    configListPath,
  };
}
