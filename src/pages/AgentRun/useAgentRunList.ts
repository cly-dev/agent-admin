import { useProjectRoute } from '@/hooks/useProjectRoute';
import { AgentRunController_findPage } from '@/services/agent-run';
import type { AgentRun } from '@/types/agent-run';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  normalizeAgentRunFilter,
  type AgentRunFilterFormValues,
  type AgentRunFilterValues,
} from './agentRunFilter';

const DEFAULT_PAGE_SIZE = 20;

export function useAgentRunList() {
  const intl = useIntl();
  const { projectId, toPagePath } = useProjectRoute();
  const [filterForm] = Form.useForm<AgentRunFilterFormValues>();
  const [appliedFilters, setAppliedFilters] = useState<AgentRunFilterValues>({});
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const loadRuns = useCallback(
    async (targetPage: number, targetPageSize: number, filters: AgentRunFilterValues) => {
      if (!projectId) {
        setRuns([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      try {
        const result = await AgentRunController_findPage(projectId, {
          page: targetPage,
          pageSize: targetPageSize,
          ...filters,
          orderBy: 'id',
          order: 'desc',
        });
        setRuns(result.list);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : intl.formatMessage({ id: 'agentRun.loadFailed' }),
        );
        setRuns([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [intl, projectId],
  );

  useEffect(() => {
    if (!projectId) {
      setRuns([]);
      setTotal(0);
      filterForm.resetFields();
      setAppliedFilters({});
      return;
    }

    filterForm.resetFields();
    setAppliedFilters({});
    setPage(1);
    void loadRuns(1, DEFAULT_PAGE_SIZE, {});
  }, [filterForm, loadRuns, projectId]);

  const handleFilterSearch = (values: AgentRunFilterFormValues) => {
    const filters = normalizeAgentRunFilter(values);
    setAppliedFilters(filters);
    setPage(1);
    void loadRuns(1, pageSize, filters);
  };

  const handleFilterReset = () => {
    filterForm.resetFields();
    setAppliedFilters({});
    setPage(1);
    void loadRuns(1, pageSize, {});
  };

  const onPageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
    void loadRuns(nextPage, nextPageSize, appliedFilters);
  };

  const runDetailPath = (id: number) => toPagePath('agent', `run/detail/${id}`);

  return {
    projectId,
    filterForm,
    appliedFilters,
    runs,
    loading,
    page,
    pageSize,
    total,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    runDetailPath,
  };
}
