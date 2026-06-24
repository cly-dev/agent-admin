import {
  LlmModelConfigController_findAll,
  LlmModelConfigController_upsert,
} from '@/services/llm-model-config';
import {
  LLM_MODEL_CONFIG_KINDS,
  type LlmModelConfig,
} from '@/types/llm-model-config';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  buildUpsertPayload,
  configToFormValues,
  type LlmModelConfigFormValues,
} from './llmModelConfigShared';

export function useLlmModelConfig() {
  const intl = useIntl();
  const [form] = Form.useForm<LlmModelConfigFormValues>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [configs, setConfigs] = useState<LlmModelConfig[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LlmModelConfig | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LlmModelConfigController_findAll();
      const order = new Map(
        LLM_MODEL_CONFIG_KINDS.map((kind, index) => [kind, index]),
      );
      setConfigs(
        [...list].sort(
          (a, b) => (order.get(a.kind) ?? 99) - (order.get(b.kind) ?? 99),
        ),
      );
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'setting.llmModel.loadFailed' }),
      );
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, [intl]);

  useEffect(() => {
    void load();
  }, [load]);

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingConfig(null);
    form.resetFields();
  };

  const openCreate = () => {
    const defaultKind = LLM_MODEL_CONFIG_KINDS[0];
    setEditingConfig(null);
    form.setFieldsValue(configToFormValues(null, defaultKind));
    setEditorOpen(true);
  };

  const openEdit = (config: LlmModelConfig) => {
    setEditingConfig(config);
    form.setFieldsValue(configToFormValues(config, config.kind));
    setEditorOpen(true);
  };

  const handleSave = async () => {
    let values: LlmModelConfigFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    let payload;
    try {
      payload = buildUpsertPayload(values);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === 'INVALID_PARAMETERS_JSON'
      ) {
        message.error(
          intl.formatMessage({ id: 'setting.llmModel.parametersInvalid' }),
        );
        return;
      }
      throw error;
    }

    setSubmitting(true);
    try {
      const saved = await LlmModelConfigController_upsert(payload);
      message.success(intl.formatMessage({ id: 'setting.llmModel.saved' }));
      setConfigs((prev) => {
        const rest = prev.filter((item) => item.kind !== saved.kind);
        return [...rest, saved];
      });
      closeEditor();
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'setting.llmModel.saveFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    loading,
    submitting,
    configs,
    editorOpen,
    editingConfig,
    openCreate,
    openEdit,
    closeEditor,
    handleSave,
    reload: load,
  };
}
