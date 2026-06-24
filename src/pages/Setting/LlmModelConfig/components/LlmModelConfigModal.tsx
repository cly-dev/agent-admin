import { AppQuerySelect } from '@/components/AppQueryPanel';
import {
  LLM_MODEL_CONFIG_KINDS,
  type LlmModelConfig,
  type LlmModelConfigKind,
} from '@/types/llm-model-config';
import { useIntl } from '@umijs/max';
import { Form, Input, InputNumber, Modal, Switch } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useMemo } from 'react';
import {
  KIND_LABEL_IDS,
  type LlmModelConfigFormValues,
} from '../llmModelConfigShared';

type LlmModelConfigModalProps = {
  open: boolean;
  submitting?: boolean;
  form: FormInstance<LlmModelConfigFormValues>;
  editingConfig: LlmModelConfig | null;
  onCancel: () => void;
  onSubmit: () => void;
};

const LlmModelConfigModal: React.FC<LlmModelConfigModalProps> = ({
  open,
  submitting = false,
  form,
  editingConfig,
  onCancel,
  onSubmit,
}) => {
  const intl = useIntl();
  const watchedKind = Form.useWatch('kind', form) as
    | LlmModelConfigKind
    | undefined;
  const kind = watchedKind ?? editingConfig?.kind ?? LLM_MODEL_CONFIG_KINDS[0];
  const isEdit = editingConfig !== null;

  const kindOptions = useMemo(() => {
    return LLM_MODEL_CONFIG_KINDS.map((value) => ({
      value,
      label: intl.formatMessage({ id: KIND_LABEL_IDS[value] }),
    }));
  }, [intl]);

  return (
    <Modal
      className="app-modal"
      title={intl.formatMessage({
        id: isEdit ? 'setting.llmModel.editTitle' : 'setting.llmModel.addTitle',
      })}
      open={open}
      width={720}
      destroyOnClose
      okText={intl.formatMessage({ id: 'setting.llmModel.save' })}
      cancelText={intl.formatMessage({ id: 'common.cancel' })}
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <p className="mb-4 text-sm text-on-surface/55">
        {intl.formatMessage({ id: 'setting.llmModel.modalHint' })}
      </p>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        disabled={submitting}
      >
        <Form.Item
          name="kind"
          label={intl.formatMessage({ id: 'setting.llmModel.field.kind' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'setting.llmModel.field.kindRequired',
              }),
            },
          ]}
        >
          <AppQuerySelect options={kindOptions} disabled={isEdit} />
        </Form.Item>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="provider"
            label={intl.formatMessage({
              id: 'setting.llmModel.field.provider',
            })}
          >
            <Input
              className="app-input"
              placeholder={intl.formatMessage({
                id: 'appQueryPanel.textPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="model"
            label={intl.formatMessage({ id: 'setting.llmModel.field.model' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'setting.llmModel.field.modelRequired',
                }),
              },
            ]}
          >
            <Input
              className="app-input"
              placeholder={intl.formatMessage({
                id: 'appQueryPanel.textPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="baseUrl"
            label={intl.formatMessage({ id: 'setting.llmModel.field.baseUrl' })}
            className="sm:col-span-2"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'setting.llmModel.field.baseUrlRequired',
                }),
              },
            ]}
          >
            <Input
              className="app-input"
              placeholder="https://api.example.com/v1"
            />
          </Form.Item>
          {kind === 'chat' ? (
            <Form.Item
              name="chatPath"
              label={intl.formatMessage({
                id: 'setting.llmModel.field.chatPath',
              })}
            >
              <Input className="app-input" placeholder="/chat/completions" />
            </Form.Item>
          ) : null}
          <Form.Item
            name="apiKey"
            label={intl.formatMessage({ id: 'setting.llmModel.field.apiKey' })}
            extra={intl.formatMessage({
              id: 'setting.llmModel.field.apiKeyHint',
            })}
            className={kind === 'chat' ? '' : 'sm:col-span-2'}
          >
            <Input.Password
              className="app-input"
              autoComplete="new-password"
              placeholder={intl.formatMessage({
                id: 'setting.llmModel.field.apiKeyPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="maxTokens"
            label={intl.formatMessage({
              id: 'setting.llmModel.field.maxTokens',
            })}
          >
            <InputNumber className="app-input w-full" min={1} precision={0} />
          </Form.Item>
          {kind === 'chat' ? (
            <Form.Item
              name="temperature"
              label={intl.formatMessage({
                id: 'setting.llmModel.field.temperature',
              })}
            >
              <InputNumber
                className="app-input w-full"
                min={0}
                max={2}
                step={0.1}
              />
            </Form.Item>
          ) : null}
          <Form.Item
            name="stream"
            label={intl.formatMessage({ id: 'setting.llmModel.field.stream' })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="enabled"
            label={intl.formatMessage({ id: 'setting.llmModel.field.enabled' })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </div>

        <Form.Item
          name="parametersJson"
          label={intl.formatMessage({
            id: 'setting.llmModel.field.parameters',
          })}
          extra={intl.formatMessage({
            id: 'setting.llmModel.field.parametersHint',
          })}
        >
          <Input.TextArea
            className="app-input"
            rows={4}
            placeholder='{"dimension": 1536}'
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LlmModelConfigModal;
