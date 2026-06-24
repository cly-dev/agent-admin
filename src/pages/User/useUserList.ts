import {
  UserController_create,
  UserController_findAll,
  UserController_remove,
} from '@/services/user';
import type { CreateUserDto, User } from '@/types/user';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import {
  normalizeUserFilter,
  type UserFilterFormValues,
  type UserFilterValues,
} from './userFilter';

const DEFAULT_PAGE_SIZE = 20;

export type UserEditorFormValues = {
  email: string;
  username: string;
  employeeId?: string;
  password?: string;
};

export function useUserList() {
  const intl = useIntl();
  const [filterForm] = Form.useForm<UserFilterFormValues>();
  const [editorForm] = Form.useForm<UserEditorFormValues>();
  const [appliedFilters, setAppliedFilters] = useState<UserFilterValues>({});
  const [allList, setAllList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const list = await UserController_findAll();
      setAllList(list);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'user.loadFailed' }),
      );
      setAllList([]);
    } finally {
      setLoading(false);
    }
  }, [intl]);

  const filteredList = useMemo(() => {
    const keyword = appliedFilters.keyword?.toLowerCase();
    const email = appliedFilters.email?.toLowerCase();
    const username = appliedFilters.username?.toLowerCase();
    const employeeId = appliedFilters.employeeId?.toLowerCase();

    return allList.filter((item) => {
      if (appliedFilters.id !== undefined && item.id !== appliedFilters.id)
        return false;
      if (email && !item.email.toLowerCase().includes(email)) return false;
      if (username && !item.username.toLowerCase().includes(username))
        return false;
      if (
        employeeId &&
        !(item.employeeId ?? '').toLowerCase().includes(employeeId)
      )
        return false;
      if (keyword) {
        const source = [
          item.email,
          item.username,
          item.employeeId,
          String(item.id),
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

  const handleFilterSearch = (values: UserFilterFormValues) => {
    setAppliedFilters(normalizeUserFilter(values));
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
    editorForm.resetFields();
    setEditorOpen(true);
  };

  const closeEditor = () => setEditorOpen(false);

  const submitEditor = async () => {
    const values = await editorForm.validateFields();
    setSubmitting(true);
    try {
      const payload: CreateUserDto = {
        email: values.email,
        username: values.username,
      };
      if (values.employeeId?.trim()) {
        payload.employeeId = values.employeeId.trim();
      }
      await UserController_create(payload);
      message.success(intl.formatMessage({ id: 'user.created' }));
      setEditorOpen(false);
      await loadAll();
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'errorFields' in error)
        return;
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'user.actionFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await UserController_remove(id);
      message.success(intl.formatMessage({ id: 'user.deleted' }));
      await loadAll();
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'user.deleteFailed' }),
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
    loadAll,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openCreate,
    closeEditor,
    submitEditor,
    remove,
  };
}
