import {
  UserAppController_create,
  UserAppController_findAll,
  UserAppController_remove,
  UserAppController_update,
} from '@/services/user-app';
import type { CreateUserAppDto, UpdateUserAppDto, UserAppRelation } from '@/types/user-app';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import {
  normalizeUserAppFilter,
  type UserAppFilterFormValues,
  type UserAppFilterValues,
} from './userAppFilter';

const DEFAULT_PAGE_SIZE = 20;

export function useUserAppList() {
  const intl = useIntl();
  const [filterForm] = Form.useForm<UserAppFilterFormValues>();
  const [editorForm] = Form.useForm<CreateUserAppDto>();
  const [appliedFilters, setAppliedFilters] = useState<UserAppFilterValues>({});
  const [allList, setAllList] = useState<UserAppRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<UserAppRelation | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const list = await UserAppController_findAll();
      setAllList(list);
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : intl.formatMessage({ id: 'user.loadFailed' }),
      );
      setAllList([]);
    } finally {
      setLoading(false);
    }
  }, [intl]);

  const filteredList = useMemo(() => {
    const keyword = appliedFilters.keyword?.toLowerCase();
    return allList.filter((item) => {
      if (appliedFilters.id !== undefined && item.id !== appliedFilters.id) return false;
      if (appliedFilters.userId !== undefined && item.userId !== appliedFilters.userId) return false;
      if (appliedFilters.appId !== undefined && item.appId !== appliedFilters.appId) return false;
      if (appliedFilters.roleId !== undefined && item.roleId !== appliedFilters.roleId) return false;
      if (keyword) {
        const source = [
          item.username,
          item.userEmail,
          item.appName,
          item.roleName,
          String(item.id),
          String(item.userId),
          String(item.appId),
          String(item.roleId),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!source.includes(keyword)) return false;
      }
      return true;
    });
  }, [allList, appliedFilters]);

  const total = filteredList.length;
  const list = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, page, pageSize]);

  const handleFilterSearch = (values: UserAppFilterFormValues) => {
    setAppliedFilters(normalizeUserAppFilter(values));
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
    setEditing(null);
    editorForm.resetFields();
    setEditorOpen(true);
  };

  const openEdit = (record: UserAppRelation) => {
    setEditing(record);
    editorForm.setFieldsValue({
      userId: record.userId,
      appId: record.appId,
      roleId: record.roleId,
    });
    setEditorOpen(true);
  };

  const closeEditor = () => setEditorOpen(false);

  const submitEditor = async () => {
    const values = await editorForm.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        const payload: UpdateUserAppDto = {
          userId: values.userId,
          appId: values.appId,
          roleId: values.roleId,
        };
        await UserAppController_update(editing.id, payload);
        message.success(intl.formatMessage({ id: 'user.updated' }));
      } else {
        await UserAppController_create(values);
        message.success(intl.formatMessage({ id: 'user.created' }));
      }
      setEditorOpen(false);
      await loadAll();
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'errorFields' in error) return;
      message.error(
        error instanceof Error ? error.message : intl.formatMessage({ id: 'user.actionFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await UserAppController_remove(id);
      message.success(intl.formatMessage({ id: 'user.deleted' }));
      await loadAll();
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : intl.formatMessage({ id: 'user.deleteFailed' }),
      );
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
    editing,
    loadAll,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openCreate,
    openEdit,
    closeEditor,
    submitEditor,
    remove,
  };
}
