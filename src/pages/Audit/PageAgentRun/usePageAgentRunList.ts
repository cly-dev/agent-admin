import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  PageAgentLlmProxyAuditController_findByAppClient,
  PageAgentLlmProxyAuditController_findDetail,
} from '@/services/page-agent-llm-proxy-audit';
import type {
  PageAgentLlmProxyAuditDetail,
  PageAgentLlmProxyAuditListItem,
} from '@/types/page-agent-llm-proxy-audit';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  normalizePageAgentRunFilter,
  type PageAgentRunFilterFormValues,
  type PageAgentRunFilterValues,
} from './pageAgentRunFilter';

export function usePageAgentRunList() {
  const intl = useIntl();
  const { projectId } = useProjectRoute();
  const [filterForm] = Form.useForm<PageAgentRunFilterFormValues>();
  const [appliedFilters, setAppliedFilters] =
    useState<PageAgentRunFilterValues>({});
  const [list, setList] = useState<PageAgentLlmProxyAuditListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<PageAgentLlmProxyAuditDetail | null>(
    null,
  );

  const loadList = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      filters: PageAgentRunFilterValues,
    ) => {
      if (!projectId) {
        setList([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      try {
        const result = await PageAgentLlmProxyAuditController_findByAppClient(
          projectId,
          {
            page: targetPage,
            pageSize: targetPageSize,
            ...filters,
          },
        );
        setList(result.list);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : intl.formatMessage({ id: 'pageAgentRun.loadFailed' }),
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
      filterForm.resetFields();
      setAppliedFilters({});
      setList([]);
      setTotal(0);
      return;
    }
    void loadList(1, DEFAULT_PAGE_SIZE, {});
  }, [filterForm, loadList, projectId]);

  const handleFilterSearch = (values: PageAgentRunFilterFormValues) => {
    const filters = normalizePageAgentRunFilter(values);
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

  const openDetail = async (record: PageAgentLlmProxyAuditListItem) => {
    if (!projectId) {
      return;
    }
    setDetailOpen(true);
    setDetail(record as PageAgentLlmProxyAuditDetail);
    setDetailLoading(true);
    try {
      const nextDetail = await PageAgentLlmProxyAuditController_findDetail(
        projectId,
        record.id,
      );
      setDetail(nextDetail);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'pageAgentRun.detail.loadFailed' }),
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
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
    detailOpen,
    detailLoading,
    detail,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openDetail,
    closeDetail,
  };
}
