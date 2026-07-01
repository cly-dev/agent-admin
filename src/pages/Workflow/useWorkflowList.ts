import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import { WorkflowController_findByAppClient } from '@/services/workflow';
import type { WorkflowListItem } from '@/types/workflow';
import { history, useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  normalizeWorkflowFilter,
  type WorkflowFilterFormValues,
  type WorkflowFilterValues,
} from './workflowFilter';

export const WORKFLOW_LIST_PATH = '/workflow/assets';
export const WORKFLOW_CREATE_PATH = '/workflow/assets/detail/create';

export function useWorkflowList() {
  const intl = useIntl();
  const { projectId } = useProjectRoute();
  const [filterForm] = Form.useForm<WorkflowFilterFormValues>();

  const [appliedFilters, setAppliedFilters] = useState<WorkflowFilterValues>({});
  const [list, setList] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const loadList = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      filters: WorkflowFilterValues,
    ) => {
      if (!projectId) {
        setList([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      try {
        const result = await WorkflowController_findByAppClient(projectId, {
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
            : intl.formatMessage({ id: 'workflow.loadFailed' }),
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
    void loadList(page, pageSize, appliedFilters);
  }, [appliedFilters, loadList, page, pageSize, projectId]);

  const handleFilterSearch = (values: WorkflowFilterFormValues) => {
    setAppliedFilters(normalizeWorkflowFilter(values));
    setPage(1);
  };

  const handleFilterReset = () => {
    filterForm.resetFields();
    setAppliedFilters({});
    setPage(1);
  };

  const onPageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  };

  const openCreate = () => {
    history.push(WORKFLOW_CREATE_PATH);
  };

  const openDetail = (id: number) => {
    history.push(`/workflow/assets/detail/${id}`);
  };

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
    openCreate,
    openDetail,
  };
}
