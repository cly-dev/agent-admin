import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  PageActionController_findByAppClient,
  PageActionController_findOne,
  PageActionController_remove,
  PageActionController_update,
} from '@/services/page-action';
import type { PageAction } from '@/types/page-action';
import { history, useIntl } from '@umijs/max';
import { Form, Modal, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  normalizePageActionFilter,
  type PageActionFilterFormValues,
  type PageActionFilterValues,
} from './pageActionFilter';
import {
  PAGE_ACTION_CREATE_PATH,
  buildPageActionEditPath,
} from './pageActionFormShared';

export type { PageActionFormValues } from './pageActionFormShared';

export function usePageActionList() {
  const intl = useIntl();
  const { projectId } = useProjectRoute();
  const [filterForm] = Form.useForm<PageActionFilterFormValues>();

  const [appliedFilters, setAppliedFilters] = useState<PageActionFilterValues>(
    {},
  );
  const [list, setList] = useState<PageAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewing, setViewing] = useState<PageAction | null>(null);
  const [toggleSubmittingId, setToggleSubmittingId] = useState<number | null>(
    null,
  );

  const loadList = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      filters: PageActionFilterValues,
    ) => {
      if (!projectId) {
        setList([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      try {
        const result = await PageActionController_findByAppClient(projectId, {
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
            : intl.formatMessage({ id: 'pageAction.loadFailed' }),
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
      setDetailOpen(false);
      setViewing(null);
      return;
    }

    filterForm.resetFields();
    setAppliedFilters({});
    setPage(1);
    void loadList(1, pageSize, {});
  }, [filterForm, loadList, pageSize, projectId]);

  const handleFilterSearch = (values: PageActionFilterFormValues) => {
    const filters = normalizePageActionFilter(values);
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

  const openCreate = () => {
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'pageAction.selectProject' }));
      return;
    }
    history.push(PAGE_ACTION_CREATE_PATH);
  };

  const openEdit = (record: PageAction) => {
    if (record.appClientId && projectId && record.appClientId !== projectId) {
      message.warning(intl.formatMessage({ id: 'pageAction.selectProject' }));
      return;
    }
    history.push(buildPageActionEditPath(record.id));
  };

  const openDetail = async (record: PageAction) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setViewing(record);
    try {
      const detail = await PageActionController_findOne(record.id);
      setViewing(detail);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'pageAction.loadFailed' }),
      );
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setViewing(null);
  };

  const handleToggleActive = async (
    record: PageAction,
    nextActive: boolean,
  ) => {
    setToggleSubmittingId(record.id);
    try {
      await PageActionController_update(record.id, { isActive: nextActive });
      message.success(intl.formatMessage({ id: 'pageAction.updated' }));
      void loadList(page, pageSize, appliedFilters);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'pageAction.actionFailed' }),
      );
    } finally {
      setToggleSubmittingId(null);
    }
  };

  const handleSortOrderBlur = async (
    record: PageAction,
    nextSortOrder: number,
  ) => {
    if (!Number.isFinite(nextSortOrder) || nextSortOrder === record.sortOrder) {
      return;
    }
    try {
      await PageActionController_update(record.id, {
        sortOrder: nextSortOrder,
      });
      void loadList(page, pageSize, appliedFilters);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'pageAction.actionFailed' }),
      );
    }
  };

  const confirmDeactivate = (record: PageAction) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'pageAction.deactivate.title' }),
      content: intl.formatMessage(
        { id: 'pageAction.deactivate.desc' },
        { name: record.name },
      ),
      okText: intl.formatMessage({ id: 'pageAction.deactivate.confirm' }),
      okButtonProps: { danger: true },
      cancelText: intl.formatMessage({ id: 'common.cancel' }),
      onOk: () => handleToggleActive(record, false),
    });
  };

  const confirmDelete = (record: PageAction) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'pageAction.delete.title' }),
      content: intl.formatMessage(
        { id: 'pageAction.delete.desc' },
        { name: record.name },
      ),
      okText: intl.formatMessage({ id: 'common.delete' }),
      okButtonProps: { danger: true },
      cancelText: intl.formatMessage({ id: 'common.cancel' }),
      onOk: async () => {
        try {
          await PageActionController_remove(record.id);
          message.success(intl.formatMessage({ id: 'pageAction.deleted' }));
          const nextPage = list.length <= 1 && page > 1 ? page - 1 : page;
          void loadList(nextPage, pageSize, appliedFilters);
        } catch (error: unknown) {
          if (error instanceof Error && error.message.includes('not found')) {
            message.success(intl.formatMessage({ id: 'pageAction.deleted' }));
            const nextPage = list.length <= 1 && page > 1 ? page - 1 : page;
            void loadList(nextPage, pageSize, appliedFilters);
            return;
          }
          message.error(
            error instanceof Error
              ? error.message
              : intl.formatMessage({ id: 'pageAction.deleteFailed' }),
          );
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
    detailOpen,
    detailLoading,
    viewing,
    toggleSubmittingId,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openCreate,
    openEdit,
    openDetail,
    closeDetail,
    handleToggleActive,
    handleSortOrderBlur,
    confirmDeactivate,
    confirmDelete,
  };
}
