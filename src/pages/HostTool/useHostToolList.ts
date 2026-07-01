import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  HostToolController_create,
  HostToolController_findByAppClient,
  HostToolController_remove,
  HostToolController_update,
} from '@/services/host-tool';
import type {
  CreateHostToolDto,
  HostTool,
  UpdateHostToolDto,
} from '@/types/host-tool';
import { useIntl } from '@umijs/max';
import { Form, Modal, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  normalizeHostToolFilter,
  type HostToolFilterFormValues,
  type HostToolFilterValues,
} from './hostToolFilter';

export type HostToolFormValues = {
  definitionKey: string;
  name: string;
  description: string;
  argsSchemaJson: string;
  argsTemplateJson?: string;
  isActive?: boolean;
};

function parseJsonObject(
  value: string | undefined,
  fieldLabel: string,
): Record<string, unknown> | null | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
    throw new Error(`${fieldLabel} must be a JSON object`);
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : `${fieldLabel} JSON is invalid`,
    );
  }
}

function stringifyJson(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

type UseHostToolListOptions = {
  genericOnly?: boolean;
  scope?: string;
  hostPageId?: number;
};

export function useHostToolList(options: UseHostToolListOptions = {}) {
  const intl = useIntl();
  const { projectId } = useProjectRoute();
  const [filterForm] = Form.useForm<HostToolFilterFormValues>();
  const [toolForm] = Form.useForm<HostToolFormValues>();

  const [appliedFilters, setAppliedFilters] = useState<HostToolFilterValues>(
    {},
  );
  const [list, setList] = useState<HostTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [editing, setEditing] = useState<HostTool | null>(null);

  const loadList = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      filters: HostToolFilterValues,
    ) => {
      if (!projectId) {
        setList([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      try {
        const result = await HostToolController_findByAppClient(projectId, {
          page: targetPage,
          pageSize: targetPageSize,
          ...filters,
          genericOnly: options.genericOnly || undefined,
          scope: options.scope || undefined,
        });
        setList(result.list);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : intl.formatMessage({ id: 'hostTool.loadFailed' }),
        );
        setList([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [intl, options.genericOnly, options.scope, projectId],
  );

  useEffect(() => {
    void loadList(1, pageSize, appliedFilters);
  }, [appliedFilters, loadList, pageSize, projectId]);

  const handleFilterSearch = (values: HostToolFilterFormValues) => {
    const filters = normalizeHostToolFilter(values);
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
    toolForm.resetFields();
    toolForm.setFieldsValue({
      isActive: true,
      argsSchemaJson: '{\n  "type": "object",\n  "properties": {}\n}',
    });
    setFormOpen(true);
  };

  const openEdit = (record: HostTool) => {
    setEditing(record);
    toolForm.setFieldsValue({
      definitionKey: record.definitionKey,
      name: record.name,
      description: record.description,
      argsSchemaJson: stringifyJson(record.argsSchema),
      argsTemplateJson: stringifyJson(record.argsTemplate),
      isActive: record.isActive ?? true,
    });
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'hostTool.selectProject' }));
      return;
    }
    const values = await toolForm.validateFields();
    let argsSchema: Record<string, unknown>;
    let argsTemplate: Record<string, unknown> | null | undefined;
    try {
      const parsedSchema = parseJsonObject(values.argsSchemaJson, 'argsSchema');
      if (!parsedSchema) {
        message.error(
          intl.formatMessage({ id: 'hostTool.form.argsSchemaRequired' }),
        );
        return;
      }
      argsSchema = parsedSchema;
      argsTemplate =
        parseJsonObject(values.argsTemplateJson, 'argsTemplate') ?? null;
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'hostTool.form.jsonInvalid' }),
      );
      return;
    }

    setFormSubmitting(true);
    try {
      if (editing) {
        const payload: UpdateHostToolDto = {
          definitionKey: values.definitionKey.trim(),
          name: values.name.trim(),
          description: values.description.trim(),
          argsSchema,
          argsTemplate,
          isActive: values.isActive,
        };
        await HostToolController_update(editing.id, payload);
        message.success(intl.formatMessage({ id: 'hostTool.updated' }));
      } else {
        const payload: CreateHostToolDto = {
          appClientId: projectId,
          hostPageId: options.hostPageId ?? (options.scope ? undefined : null),
          definitionKey: values.definitionKey.trim(),
          name: values.name.trim(),
          description: values.description.trim(),
          argsSchema,
          argsTemplate,
          isActive: values.isActive,
        };
        await HostToolController_create(payload);
        message.success(intl.formatMessage({ id: 'hostTool.created' }));
      }
      setFormOpen(false);
      void loadList(page, pageSize, appliedFilters);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'hostTool.actionFailed' }),
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDelete = (record: HostTool) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'hostTool.delete.title' }),
      content: intl.formatMessage(
        { id: 'hostTool.delete.desc' },
        { name: record.name },
      ),
      okText: intl.formatMessage({ id: 'common.delete' }),
      okButtonProps: { danger: true },
      cancelText: intl.formatMessage({ id: 'common.cancel' }),
      onOk: async () => {
        try {
          await HostToolController_remove(record.id);
          message.success(intl.formatMessage({ id: 'hostTool.deleted' }));
          const nextPage = list.length <= 1 && page > 1 ? page - 1 : page;
          void loadList(nextPage, pageSize, appliedFilters);
        } catch (error: unknown) {
          message.error(
            error instanceof Error
              ? error.message
              : intl.formatMessage({ id: 'hostTool.deleteFailed' }),
          );
        }
      },
    });
  };

  return {
    projectId,
    filterForm,
    toolForm,
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
    handleFormSubmit,
    confirmDelete,
    reload: () => void loadList(page, pageSize, appliedFilters),
  };
}
