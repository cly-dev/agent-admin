import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import { ToolController_findPage } from '@/services/tool';
import {
  ToolCategoryController_findOne,
  ToolCategoryController_update,
} from '@/services/tool-category';
import type { Tool } from '@/types/tool';
import type {
  ToolCategory,
  UpdateToolCategoryDto,
} from '@/types/tool-category';
import { history, useIntl, useParams } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

export type ToolCategoryFormValues = {
  label: string;
  description?: string;
  sortOrder?: number;
};

export function useToolCategoryDetail() {
  const intl = useIntl();
  const { id: idParam } = useParams<{ id: string }>();
  const { projectId, toPagePath } = useProjectRoute();
  const [form] = Form.useForm<ToolCategoryFormValues>();

  const categoryId = Number(idParam);
  const isValidCategoryId = Number.isFinite(categoryId) && categoryId > 0;
  const listPath = toPagePath('tool', 'category');

  const [category, setCategory] = useState<ToolCategory | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tools, setTools] = useState<Tool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const loadCategory = useCallback(async () => {
    if (!isValidCategoryId) {
      setCategory(null);
      setCategoryLoading(false);
      return;
    }

    setCategoryLoading(true);
    try {
      const detail = await ToolCategoryController_findOne(categoryId);
      setCategory(detail);
      form.setFieldsValue({
        label: detail.label,
        description: detail.description,
        sortOrder: detail.sortOrder,
      });
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'toolCategory.loadFailed' }),
      );
      setCategory(null);
    } finally {
      setCategoryLoading(false);
    }
  }, [categoryId, form, intl, isValidCategoryId]);

  const loadTools = useCallback(async () => {
    if (!projectId || !isValidCategoryId) {
      setTools([]);
      setTotal(0);
      return;
    }

    setToolsLoading(true);
    try {
      const result = await ToolController_findPage({
        appClientId: projectId,
        toolCategoryId: categoryId,
        page,
        pageSize,
        orderBy: 'updatedAt',
        order: 'desc',
      });
      setTools(result.list);
      setTotal(result.total);

      const maxPage = Math.max(1, Math.ceil(result.total / pageSize) || 1);
      if (page > maxPage) {
        setPage(maxPage);
      }
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'tool.loadFailed' }),
      );
      setTools([]);
      setTotal(0);
    } finally {
      setToolsLoading(false);
    }
  }, [categoryId, intl, isValidCategoryId, page, pageSize, projectId]);

  useEffect(() => {
    void loadCategory();
  }, [loadCategory]);

  useEffect(() => {
    setPage(1);
  }, [projectId, categoryId]);

  useEffect(() => {
    void loadTools();
  }, [loadTools]);

  const handleSave = async () => {
    if (!category) {
      return;
    }

    const values = await form.validateFields();
    const payload: UpdateToolCategoryDto = {
      label: values.label.trim(),
      description: values.description?.trim() || undefined,
      sortOrder: values.sortOrder ?? 0,
    };

    setSaving(true);
    try {
      const updated = await ToolCategoryController_update(category.id, payload);
      setCategory(updated);
      message.success(intl.formatMessage({ id: 'toolCategory.updated' }));
      history.replace(listPath);
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
          : intl.formatMessage({ id: 'toolCategory.actionFailed' }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    history.push(listPath);
  };

  const openToolDetail = (toolId: number) => {
    history.push(toPagePath('tool', `detail/${toolId}`));
  };

  const onToolsPageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  };

  return {
    form,
    category,
    categoryLoading,
    saving,
    isValidCategoryId,
    listPath,
    projectId,
    tools,
    toolsLoading,
    page,
    pageSize,
    total,
    onToolsPageChange,
    handleSave,
    handleBack,
    openToolDetail,
    reloadTools: loadTools,
  };
}
