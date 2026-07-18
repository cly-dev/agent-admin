import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  FlowController_findByAppClient,
  FlowController_remove,
} from '@/services/flow';
import type { FlowListItem } from '@/types/flow';
import { formatApiErrorMessage } from '@/utils/api-error';
import { history, useIntl } from '@umijs/max';
import { Form, Modal, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { formatFlowSaveError } from './flowApiError';
import {
  normalizeFlowFilter,
  type FlowFilterFormValues,
  type FlowFilterValues,
} from './flowFilter';

import { buildFlowCreatePath } from './flowBindEntry';

export const FLOW_LIST_PATH = '/flow/assets';
export const FLOW_CREATE_PATH = '/flow/assets/detail/create';
export const FLOW_MIGRATE_PATH = '/flow/migrate';

export function useFlowList() {
  const intl = useIntl();
  const { projectId } = useProjectRoute();
  const [filterForm] = Form.useForm<FlowFilterFormValues>();

  const [appliedFilters, setAppliedFilters] = useState<FlowFilterValues>({});
  const [list, setList] = useState<FlowListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const loadList = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      filters: FlowFilterValues,
    ) => {
      if (!projectId) {
        setList([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      try {
        const result = await FlowController_findByAppClient(projectId, {
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
          formatApiErrorMessage(
            error,
            intl.formatMessage({ id: 'flow.loadFailed' }),
          ),
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

  const handleFilterSearch = (values: FlowFilterFormValues) => {
    setAppliedFilters(normalizeFlowFilter(values));
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

  const openCreate = useCallback((bindEntry?: 'skill' | 'page_action' | null) => {
    history.push(buildFlowCreatePath(bindEntry));
  }, []);

  const openDetail = (id: number) => {
    history.push(`/flow/assets/detail/${id}`);
  };

  const openMigrate = () => {
    history.push(FLOW_MIGRATE_PATH);
  };

  const confirmDelete = (record: FlowListItem) => {
    const refCount = record.skillRefCount + record.pageActionRefCount;
    if (refCount > 0) {
      Modal.warning({
        title: intl.formatMessage({ id: 'flow.delete.stillBoundTitle' }),
        content: intl.formatMessage(
          { id: 'flow.delete.stillBoundDesc' },
          {
            name: record.name,
            skills: record.skillRefCount,
            pageActions: record.pageActionRefCount,
          },
        ),
      });
      return;
    }
    Modal.confirm({
      title: intl.formatMessage({ id: 'flow.delete.title' }),
      content: intl.formatMessage(
        { id: 'flow.delete.desc' },
        { name: record.name },
      ),
      okText: intl.formatMessage({ id: 'common.delete' }),
      okButtonProps: { danger: true },
      cancelText: intl.formatMessage({ id: 'common.cancel' }),
      onOk: async () => {
        try {
          await FlowController_remove(record.id);
          message.success(intl.formatMessage({ id: 'flow.deleted' }));
          const nextPage = list.length <= 1 && page > 1 ? page - 1 : page;
          void loadList(nextPage, pageSize, appliedFilters);
        } catch (error: unknown) {
          message.error(formatFlowSaveError(intl, error, 'flow.deleteFailed'));
        }
      },
    });
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
    openMigrate,
    confirmDelete,
  };
}
