import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  HostPageController_create,
  HostPageController_findByAppClient,
  HostPageController_remove,
  HostPageController_update,
} from '@/services/host-page';
import type {
  CreateHostPageDto,
  HostPage,
  UpdateHostPageDto,
} from '@/types/host-page';
import { history, useIntl } from '@umijs/max';
import { Form, Modal, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  normalizeHostPageFilter,
  type HostPageFilterFormValues,
  type HostPageFilterValues,
} from './hostPageFilter';

export type HostPageFormValues = {
  scope: string;
  label: string;
  description?: string;
  routePattern?: string;
  isActive?: boolean;
};

export function useHostPageList() {
  const intl = useIntl();
  const { projectId } = useProjectRoute();
  const [filterForm] = Form.useForm<HostPageFilterFormValues>();
  const [pageForm] = Form.useForm<HostPageFormValues>();

  const [appliedFilters, setAppliedFilters] = useState<HostPageFilterValues>(
    {},
  );
  const [list, setList] = useState<HostPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [editing, setEditing] = useState<HostPage | null>(null);

  const loadList = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      filters: HostPageFilterValues,
    ) => {
      if (!projectId) {
        setList([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      try {
        const result = await HostPageController_findByAppClient(projectId, {
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
            : intl.formatMessage({ id: 'hostPage.loadFailed' }),
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
    void loadList(1, pageSize, appliedFilters);
  }, [appliedFilters, loadList, pageSize, projectId]);

  const handleFilterSearch = (values: HostPageFilterFormValues) => {
    const filters = normalizeHostPageFilter(values);
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
    setEditing(null);
    pageForm.resetFields();
    pageForm.setFieldsValue({ isActive: true });
    setFormOpen(true);
  };

  const openEdit = (record: HostPage) => {
    setEditing(record);
    pageForm.setFieldsValue({
      scope: record.scope,
      label: record.label,
      description: record.description ?? '',
      routePattern: record.routePattern ?? '',
      isActive: record.isActive ?? true,
    });
    setFormOpen(true);
  };

  const openDetail = (record: HostPage) => {
    history.push(`/tool/host-tool/page/${record.id}`);
  };

  const handleFormSubmit = async () => {
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'hostPage.selectProject' }));
      return;
    }
    const values = await pageForm.validateFields();
    setFormSubmitting(true);
    try {
      if (editing) {
        const payload: UpdateHostPageDto = {
          scope: values.scope.trim(),
          label: values.label.trim(),
          description: values.description?.trim() || null,
          routePattern: values.routePattern?.trim() || null,
          isActive: values.isActive,
        };
        await HostPageController_update(editing.id, payload);
        message.success(intl.formatMessage({ id: 'hostPage.updated' }));
      } else {
        const payload: CreateHostPageDto = {
          appClientId: projectId,
          scope: values.scope.trim(),
          label: values.label.trim(),
          description: values.description?.trim() || undefined,
          routePattern: values.routePattern?.trim() || undefined,
          isActive: values.isActive,
        };
        await HostPageController_create(payload);
        message.success(intl.formatMessage({ id: 'hostPage.created' }));
      }
      setFormOpen(false);
      void loadList(page, pageSize, appliedFilters);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'hostPage.actionFailed' }),
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = (record: HostPage) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'hostPage.delete.title' }),
      content: intl.formatMessage(
        { id: 'hostPage.delete.desc' },
        { label: record.label },
      ),
      okText: intl.formatMessage({ id: 'common.delete' }),
      okButtonProps: { danger: true },
      cancelText: intl.formatMessage({ id: 'common.cancel' }),
      onOk: async () => {
        try {
          await HostPageController_remove(record.id);
          message.success(intl.formatMessage({ id: 'hostPage.deleted' }));
          const nextPage = list.length <= 1 && page > 1 ? page - 1 : page;
          void loadList(nextPage, pageSize, appliedFilters);
        } catch (error: unknown) {
          message.error(
            error instanceof Error
              ? error.message
              : intl.formatMessage({ id: 'hostPage.deleteFailed' }),
          );
        }
      },
    });
  };

  return {
    projectId,
    filterForm,
    pageForm,
    appliedFilters,
    list,
    loading,
    page,
    pageSize,
    total,
    formOpen,
    formSubmitting,
    editing,
    setFormOpen,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openCreate,
    openEdit,
    openDetail,
    handleFormSubmit,
    confirmDelete,
  };
}
