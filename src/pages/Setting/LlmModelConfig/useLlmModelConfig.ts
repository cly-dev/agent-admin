import {
  LlmModelConfigController_activate,
  LlmModelConfigController_create,
  LlmModelConfigController_findAll,
  LlmModelConfigController_testConnection,
  LlmModelConfigController_update,
} from '@/services/llm-model-config';
import {
  LLM_MODEL_CONFIG_KINDS,
  type LlmModelConfig,
} from '@/types/llm-model-config';
import { formatApiErrorMessage } from '@/utils/api-error';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  buildCreatePayload,
  buildUpdatePayload,
  configToFormValues,
  type LlmModelConfigFormValues,
} from './llmModelConfigShared';

function sortConfigs(list: LlmModelConfig[]): LlmModelConfig[] {
  const order = new Map(
    LLM_MODEL_CONFIG_KINDS.map((kind, index) => [kind, index]),
  );
  return [...list].sort((a, b) => {
    const kindDiff = (order.get(a.kind) ?? 99) - (order.get(b.kind) ?? 99);
    if (kindDiff !== 0) {
      return kindDiff;
    }
    const enabledDiff = Number(b.enabled === true) - Number(a.enabled === true);
    if (enabledDiff !== 0) {
      return enabledDiff;
    }
    return b.id - a.id;
  });
}

function upsertLocalList(
  prev: LlmModelConfig[],
  saved: LlmModelConfig,
): LlmModelConfig[] {
  const rest = prev
    .filter((item) => item.id !== saved.id)
    .map((item) =>
      saved.enabled && item.kind === saved.kind && item.enabled
        ? { ...item, enabled: false }
        : item,
    );
  return sortConfigs([...rest, saved]);
}

export function useLlmModelConfig() {
  const intl = useIntl();
  const [form] = Form.useForm<LlmModelConfigFormValues>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [configs, setConfigs] = useState<LlmModelConfig[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LlmModelConfig | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await LlmModelConfigController_findAll();
      setConfigs(sortConfigs(list));
    } catch (error: unknown) {
      message.error(
        formatApiErrorMessage(
          error,
          intl.formatMessage({ id: 'setting.llmModel.loadFailed' }),
        ),
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

    setSubmitting(true);
    try {
      const saved = editingConfig
        ? await LlmModelConfigController_update(
            editingConfig.id,
            buildUpdatePayload(values, editingConfig),
          )
        : await LlmModelConfigController_create(buildCreatePayload(values));
      message.success(intl.formatMessage({ id: 'setting.llmModel.saved' }));
      setConfigs((prev) => upsertLocalList(prev, saved));
      closeEditor();
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
      message.error(
        formatApiErrorMessage(
          error,
          intl.formatMessage({ id: 'setting.llmModel.saveFailed' }),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (config: LlmModelConfig) => {
    if (config.enabled) {
      return;
    }
    setActionId(config.id);
    try {
      const saved = await LlmModelConfigController_activate(config.id);
      message.success(intl.formatMessage({ id: 'setting.llmModel.activated' }));
      setConfigs((prev) => upsertLocalList(prev, saved));
    } catch (error: unknown) {
      message.error(
        formatApiErrorMessage(
          error,
          intl.formatMessage({ id: 'setting.llmModel.activateFailed' }),
        ),
      );
    } finally {
      setActionId(null);
    }
  };

  const handleTestConnection = async (config: LlmModelConfig) => {
    setActionId(config.id);
    try {
      const result = await LlmModelConfigController_testConnection(config.id);
      if (result.ok) {
        message.success(
          intl.formatMessage(
            { id: 'setting.llmModel.testOk' },
            { ms: result.durationMs },
          ),
        );
      } else {
        message.error(
          result.error ||
            intl.formatMessage({ id: 'setting.llmModel.testFailed' }),
        );
      }
    } catch (error: unknown) {
      message.error(
        formatApiErrorMessage(
          error,
          intl.formatMessage({ id: 'setting.llmModel.testFailed' }),
        ),
      );
    } finally {
      setActionId(null);
    }
  };

  return {
    form,
    loading,
    submitting,
    actionId,
    configs,
    editorOpen,
    editingConfig,
    openCreate,
    openEdit,
    closeEditor,
    handleSave,
    handleActivate,
    handleTestConnection,
    reload: load,
  };
}
