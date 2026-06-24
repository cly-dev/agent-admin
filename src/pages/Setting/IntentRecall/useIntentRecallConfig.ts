import {
  LlmModelConfigController_getIntentRecall,
  LlmModelConfigController_updateIntentRecall,
} from '@/services/llm-model-config';
import type {
  IntentRecallConfig,
  UpdateIntentRecallConfigDto,
} from '@/types/llm-model-config';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

export type IntentRecallFormValues = {
  recallMode?: IntentRecallConfig['recallMode'];
  vectorTopK?: number;
  vectorMinScore?: number;
  bindToolsMax?: number;
  fallbackToKeyword?: boolean;
};

function configToFormValues(
  config: IntentRecallConfig,
): IntentRecallFormValues {
  return {
    recallMode: config.recallMode ?? 'auto',
    vectorTopK: config.vectorTopK,
    vectorMinScore: config.vectorMinScore,
    bindToolsMax: config.bindToolsMax,
    fallbackToKeyword: config.fallbackToKeyword ?? true,
  };
}

export function useIntentRecallConfig() {
  const intl = useIntl();
  const [form] = Form.useForm<IntentRecallFormValues>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const config = await LlmModelConfigController_getIntentRecall();
      form.setFieldsValue(configToFormValues(config));
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'setting.intentRecall.loadFailed' }),
      );
    } finally {
      setLoading(false);
    }
  }, [form, intl]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    let values: IntentRecallFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const payload: UpdateIntentRecallConfigDto = {
      recallMode: values.recallMode,
      vectorTopK: values.vectorTopK,
      vectorMinScore: values.vectorMinScore,
      bindToolsMax: values.bindToolsMax,
      fallbackToKeyword: values.fallbackToKeyword,
    };

    setSubmitting(true);
    try {
      const saved = await LlmModelConfigController_updateIntentRecall(payload);
      form.setFieldsValue(configToFormValues(saved));
      message.success(intl.formatMessage({ id: 'setting.intentRecall.saved' }));
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'setting.intentRecall.saveFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    loading,
    submitting,
    handleSave,
    reload: load,
  };
}
