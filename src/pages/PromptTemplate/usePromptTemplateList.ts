import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { AgentController_findAll } from '@/services/agent';
import {
  PromptTemplateController_createVersion,
  PromptTemplateController_findOne,
  PromptTemplateController_findPage,
  PromptTemplateController_listCreatableKeys,
  PromptTemplateController_publish,
  PromptTemplateController_remove,
  PromptTemplateController_update,
} from '@/services/prompt-template';
import type { Agent } from '@/types/agent';
import type {
  CreatePromptTemplateVersionDto,
  PromptTemplateCreatableKey,
  PromptTemplateDetail,
  PromptTemplateVersion,
  UpdatePromptTemplateDto,
} from '@/types/prompt-template';
import { useIntl } from '@umijs/max';
import { Form, Modal, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  normalizePromptTemplateFilter,
  type PromptTemplateFilterFormValues,
  type PromptTemplateFilterValues,
} from './promptTemplateFilter';

export type PromptTemplateFormValues = CreatePromptTemplateVersionDto;
export type UpdatePromptTemplateFormValues = UpdatePromptTemplateDto;

export function usePromptTemplateList() {
  const intl = useIntl();
  const [filterForm] = Form.useForm<PromptTemplateFilterFormValues>();
  const [createForm] = Form.useForm<PromptTemplateFormValues>();
  const [editForm] = Form.useForm<UpdatePromptTemplateFormValues>();

  const [appliedFilters, setAppliedFilters] =
    useState<PromptTemplateFilterValues>({});
  const [list, setList] = useState<PromptTemplateVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [creatableKeys, setCreatableKeys] = useState<
    PromptTemplateCreatableKey[]
  >([]);
  const [keysLoading, setKeysLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailAnchorId, setDetailAnchorId] = useState<number | null>(null);
  const [viewingVersion, setViewingVersion] =
    useState<PromptTemplateVersion | null>(null);
  const [publishSubmittingId, setPublishSubmittingId] = useState<number | null>(
    null,
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editing, setEditing] = useState<PromptTemplateVersion | null>(null);

  const loadAgents = useCallback(async () => {
    setAgentsLoading(true);
    try {
      const result = await AgentController_findAll();
      setAgents(result);
    } catch {
      setAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  const loadList = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      filters: PromptTemplateFilterValues,
    ) => {
      setLoading(true);
      try {
        const result = await PromptTemplateController_findPage({
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
            : intl.formatMessage({ id: 'promptTemplate.loadFailed' }),
        );
        setList([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [intl],
  );

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  useEffect(() => {
    void loadList(1, DEFAULT_PAGE_SIZE, {});
  }, [loadList]);

  const agentOptions = useMemo(
    () =>
      agents.map((agent) => ({
        value: agent.id,
        label: agent.name?.trim()
          ? `${agent.name} (#${agent.id})`
          : `#${agent.id}`,
      })),
    [agents],
  );

  const keyOptions = useMemo(
    () =>
      creatableKeys.map((item) => ({
        value: item.key,
        label: item.title ? `${item.title} (${item.key})` : item.key,
        meta: item,
      })),
    [creatableKeys],
  );

  const loadCreatableKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      const keys = await PromptTemplateController_listCreatableKeys();
      setCreatableKeys(keys);
      return keys;
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'promptTemplate.keysLoadFailed' }),
      );
      setCreatableKeys([]);
      return [];
    } finally {
      setKeysLoading(false);
    }
  }, [intl]);

  const buildKeyMetaPatch = useCallback(
    (meta: PromptTemplateCreatableKey): Partial<PromptTemplateFormValues> => {
      const patch: Partial<PromptTemplateFormValues> = {};
      if (meta.category) {
        patch.category = meta.category;
      }
      if (meta.locale) {
        patch.locale = meta.locale;
      }
      if (meta.title) {
        patch.title = meta.title;
      }
      if (meta.description) {
        patch.description = meta.description;
      }
      return patch;
    },
    [],
  );

  const applyKeyMeta = useCallback(
    (key: string, sourceKeys = creatableKeys) => {
      const meta = sourceKeys.find((item) => item.key === key);
      if (!meta) {
        return;
      }
      const patch = buildKeyMetaPatch(meta);
      if (Object.keys(patch).length > 0) {
        createForm.setFieldsValue(patch);
      }
    },
    [buildKeyMetaPatch, creatableKeys, createForm],
  );

  const handleFilterSearch = (values: PromptTemplateFilterFormValues) => {
    const filters = normalizePromptTemplateFilter(values);
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

  const openCreate = async () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      locale: 'zh-CN',
      publish: true,
    });
    setCreateOpen(true);

    const keys = await loadCreatableKeys();
    if (keys.length === 1) {
      const only = keys[0];
      createForm.setFieldsValue({
        key: only.key,
        locale: only.locale ?? 'zh-CN',
        publish: true,
        ...buildKeyMetaPatch(only),
      });
    }
  };

  const handleKeyChange = (key: string) => {
    applyKeyMeta(key);
  };

  const handleCreate = async () => {
    const values = await createForm.validateFields();
    const selectedKey = typeof values.key === 'string' ? values.key.trim() : '';
    if (!selectedKey) {
      message.warning(
        intl.formatMessage({ id: 'promptTemplate.form.keyRequired' }),
      );
      return;
    }

    const payload: CreatePromptTemplateVersionDto = {
      key: selectedKey,
      locale: values.locale?.trim() || 'zh-CN',
      category: values.category?.trim() || undefined,
      title: values.title?.trim() || undefined,
      description: values.description?.trim() || undefined,
      content: values.content.trim(),
      publish: values.publish ?? true,
    };

    if (typeof values.appClientId === 'number' && values.appClientId > 0) {
      payload.appClientId = values.appClientId;
    }
    if (typeof values.agentId === 'number' && values.agentId > 0) {
      payload.agentId = values.agentId;
    }

    setCreateSubmitting(true);
    try {
      await PromptTemplateController_createVersion(payload);
      message.success(intl.formatMessage({ id: 'promptTemplate.created' }));
      setCreateOpen(false);
      void loadList(page, pageSize, appliedFilters);
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
          : intl.formatMessage({ id: 'promptTemplate.actionFailed' }),
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const pickViewingVersion = useCallback(
    (
      result: PromptTemplateDetail,
      versionId: number,
    ): PromptTemplateVersion | null => {
      return (
        result.versions.find((item) => item.id === versionId) ??
        result.activeVersion ??
        result.versions[0] ??
        null
      );
    },
    [],
  );

  const refreshDetail = useCallback(
    async (versionId: number) => {
      if (!detailOpen) {
        return;
      }
      try {
        const refreshed = await PromptTemplateController_findOne(versionId);
        const next = pickViewingVersion(refreshed, versionId);
        if (next) {
          setViewingVersion(next);
          setDetailAnchorId(versionId);
        }
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : intl.formatMessage({ id: 'promptTemplate.loadFailed' }),
        );
      }
    },
    [detailOpen, intl, pickViewingVersion],
  );

  const openDetail = async (record: PromptTemplateVersion) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setViewingVersion(record);
    setDetailAnchorId(record.id);
    try {
      const result = await PromptTemplateController_findOne(record.id);
      const next = pickViewingVersion(result, record.id);
      if (next) {
        setViewingVersion(next);
      }
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'promptTemplate.loadFailed' }),
      );
      setDetailOpen(false);
      setDetailAnchorId(null);
      setViewingVersion(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setViewingVersion(null);
    setDetailAnchorId(null);
  };

  const openEdit = (record: PromptTemplateVersion) => {
    setEditing(record);
    editForm.setFieldsValue({
      category: record.category,
      title: record.title,
      description: record.description,
      content: record.content ?? '',
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editing) {
      return;
    }

    const values = await editForm.validateFields();
    const payload: UpdatePromptTemplateDto = {
      category: values.category?.trim() || undefined,
      title: values.title?.trim() || undefined,
      description: values.description?.trim() || undefined,
      content: values.content?.trim() || undefined,
    };

    if (!payload.content) {
      message.warning(
        intl.formatMessage({ id: 'promptTemplate.form.contentRequired' }),
      );
      return;
    }

    setEditSubmitting(true);
    try {
      await PromptTemplateController_update(editing.id, payload);
      message.success(intl.formatMessage({ id: 'promptTemplate.updated' }));
      setEditOpen(false);
      setEditing(null);
      void loadList(page, pageSize, appliedFilters);
      if (detailOpen) {
        void refreshDetail(editing.id);
      }
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
          : intl.formatMessage({ id: 'promptTemplate.actionFailed' }),
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (record: PromptTemplateVersion) => {
    try {
      await PromptTemplateController_remove(record.id);
      message.success(intl.formatMessage({ id: 'promptTemplate.deleted' }));

      if (detailOpen && viewingVersion?.id === record.id) {
        closeDetail();
      }

      void loadList(page, pageSize, appliedFilters);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'promptTemplate.deleteFailed' }),
      );
    }
  };

  const confirmDelete = (record: PromptTemplateVersion) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'promptTemplate.deleteTitle' }),
      content: intl.formatMessage({ id: 'promptTemplate.deleteDesc' }),
      centered: true,
      okButtonProps: { danger: true },
      onOk: async () => {
        await handleDelete(record);
      },
    });
  };

  const handlePublish = async (versionId: number) => {
    setPublishSubmittingId(versionId);
    try {
      await PromptTemplateController_publish(versionId);
      message.success(intl.formatMessage({ id: 'promptTemplate.published' }));
      if (detailOpen && detailAnchorId) {
        void refreshDetail(detailAnchorId);
      }
      void loadList(page, pageSize, appliedFilters);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'promptTemplate.publishFailed' }),
      );
    } finally {
      setPublishSubmittingId(null);
    }
  };

  return {
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
    agentOptions,
    agentsLoading,
    keyOptions,
    keysLoading,
    handleKeyChange,
    createForm,
    createOpen,
    createSubmitting,
    openCreate,
    setCreateOpen,
    handleCreate,
    detailOpen,
    detailLoading,
    viewingVersion,
    openDetail,
    closeDetail,
    handlePublish,
    publishSubmittingId,
    editForm,
    editOpen,
    editSubmitting,
    editing,
    openEdit,
    setEditOpen,
    handleEdit,
    confirmDelete,
  };
}
