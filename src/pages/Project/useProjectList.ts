import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import {
  AppClientController_create,
  AppClientController_findAll,
} from '@/services/admin-app-client';
import type { AppClient, CreateAppClientDto } from '@/types/admin-app-client';
import { history, useIntl, useModel } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type ProjectEditorFormValues = {
  name: string;
  description?: string;
  isActive: boolean;
};

export function useProjectList() {
  const intl = useIntl();
  const { refreshProjects } = useModel('project');
  const [editorForm] = Form.useForm<ProjectEditorFormValues>();
  const [allList, setAllList] = useState<AppClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [editorOpen, setEditorOpen] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const list = await AppClientController_findAll();
      setAllList(list);
      await refreshProjects();
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'project.loadFailed' }),
      );
      setAllList([]);
    } finally {
      setLoading(false);
    }
  }, [intl, refreshProjects]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const normalizedKeyword = keyword.trim().toLowerCase();

  const filteredList = useMemo(() => {
    if (!normalizedKeyword) return allList;
    return allList.filter((item) => {
      const source = [item.name, item.description, String(item.id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return source.includes(normalizedKeyword);
    });
  }, [allList, normalizedKeyword]);

  const total = filteredList.length;
  const activeCount = useMemo(
    () => filteredList.filter((item) => item.isActive !== false).length,
    [filteredList],
  );

  const list = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [normalizedKeyword, pageSize]);

  const onPageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  };

  const openDetail = (project: AppClient) => {
    history.push(`/project/detail/${project.id}`);
  };

  const openCreate = () => {
    editorForm.setFieldsValue({ name: '', description: '', isActive: true });
    setEditorOpen(true);
  };

  const closeEditor = () => setEditorOpen(false);

  const submitCreate = async () => {
    const values = await editorForm.validateFields();
    setSubmitting(true);
    try {
      const payload: CreateAppClientDto = {
        name: values.name.trim(),
        isActive: values.isActive,
      };
      if (values.description?.trim()) {
        payload.description = values.description.trim();
      }
      const created = await AppClientController_create(payload);
      message.success(intl.formatMessage({ id: 'project.created' }));
      setEditorOpen(false);
      await loadAll();
      history.push(`/project/detail/${created.id}`);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'errorFields' in error)
        return;
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'project.actionFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isSearchActive = normalizedKeyword.length > 0;
  const showEmpty = !loading && total === 0;
  const showPagination = total > 0;

  return {
    list,
    loading,
    keyword,
    setKeyword,
    page,
    pageSize,
    total,
    activeCount,
    isSearchActive,
    showEmpty,
    showPagination,
    onPageChange,
    openDetail,
    openCreate,
    editorOpen,
    editorForm,
    submitting,
    closeEditor,
    submitCreate,
    loadAll,
  };
}
