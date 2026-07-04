import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import {
  AdminUserController_create,
  AdminUserController_findPage,
  AdminUserController_resetPassword,
  AdminUserController_update,
} from '@/services/admin-user';
import type {
  AdminRole,
  AdminUser,
  CreateAdminUserDto,
  UpdateAdminUserDto,
} from '@/types/admin-user';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useState } from 'react';
import {
  normalizeAdminUserFilter,
  type AdminUserFilterFormValues,
  type AdminUserFilterValues,
} from './adminUserFilter';

export type AdminUserEditorFormValues = {
  email: string;
  username: string;
  role: AdminRole;
  isActive?: boolean;
};

export type GeneratedPasswordPayload = {
  email: string;
  username: string;
  generatedPassword: string;
};

export function useAdminUserList() {
  const intl = useIntl();
  const [filterForm] = Form.useForm<AdminUserFilterFormValues>();
  const [editorForm] = Form.useForm<AdminUserEditorFormValues>();
  const [appliedFilters, setAppliedFilters] = useState<AdminUserFilterValues>(
    {},
  );
  const [list, setList] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminUser | null>(null);
  const [generatedPassword, setGeneratedPassword] =
    useState<GeneratedPasswordPayload | null>(null);

  const loadList = useCallback(
    async (
      nextPage: number,
      nextPageSize: number,
      filters: AdminUserFilterValues,
    ) => {
      setLoading(true);
      try {
        const result = await AdminUserController_findPage({
          page: nextPage,
          pageSize: nextPageSize,
          keyword: filters.keyword,
          role: filters.role,
          isActive: filters.isActive,
          orderBy: 'id',
          order: 'desc',
        });
        setList(result.items);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : intl.formatMessage({ id: 'adminUser.loadFailed' }),
        );
        setList([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [intl],
  );

  const handleFilterSearch = (values: AdminUserFilterFormValues) => {
    const filters = normalizeAdminUserFilter(values);
    setAppliedFilters(filters);
    void loadList(1, pageSize, filters);
  };

  const handleFilterReset = () => {
    filterForm.resetFields();
    setAppliedFilters({});
    void loadList(1, pageSize, {});
  };

  const onPageChange = (nextPage: number, nextPageSize: number) => {
    void loadList(nextPage, nextPageSize, appliedFilters);
  };

  const openCreate = () => {
    setEditingRecord(null);
    editorForm.resetFields();
    editorForm.setFieldsValue({
      role: 'OPERATOR',
      isActive: true,
    });
    setEditorOpen(true);
  };

  const openEdit = (record: AdminUser) => {
    setEditingRecord(record);
    editorForm.setFieldsValue({
      email: record.email,
      username: record.username,
      role: record.role,
      isActive: record.isActive,
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingRecord(null);
  };

  const closeGeneratedPassword = () => {
    setGeneratedPassword(null);
  };

  const submitEditor = async () => {
    const values = await editorForm.validateFields();
    setSubmitting(true);
    try {
      if (editingRecord) {
        const payload: UpdateAdminUserDto = {
          email: values.email.trim(),
          username: values.username.trim(),
          role: values.role,
          isActive: values.isActive,
        };
        await AdminUserController_update(editingRecord.id, payload);
        message.success(intl.formatMessage({ id: 'adminUser.updated' }));
        setEditorOpen(false);
        setEditingRecord(null);
        await loadList(page, pageSize, appliedFilters);
        return;
      }

      const payload: CreateAdminUserDto = {
        email: values.email.trim(),
        username: values.username.trim(),
        role: values.role,
        isActive: values.isActive ?? true,
      };
      const result = await AdminUserController_create(payload);
      message.success(intl.formatMessage({ id: 'adminUser.created' }));
      setEditorOpen(false);
      setGeneratedPassword({
        email: result.admin.email,
        username: result.admin.username,
        generatedPassword: result.generatedPassword,
      });
      await loadList(1, pageSize, appliedFilters);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'errorFields' in error
      ) {
        return;
      }
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'adminUser.actionFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (record: AdminUser) => {
    setSubmitting(true);
    try {
      const result = await AdminUserController_resetPassword(record.id);
      message.success(intl.formatMessage({ id: 'adminUser.passwordReset' }));
      setGeneratedPassword({
        email: result.admin.email,
        username: result.admin.username,
        generatedPassword: result.generatedPassword,
      });
      await loadList(page, pageSize, appliedFilters);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'adminUser.resetFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    filterForm,
    editorForm,
    appliedFilters,
    list,
    total,
    page,
    pageSize,
    loading,
    submitting,
    editorOpen,
    editingRecord,
    generatedPassword,
    loadList,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openCreate,
    openEdit,
    closeEditor,
    submitEditor,
    resetPassword,
    closeGeneratedPassword,
  };
}
