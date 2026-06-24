import { useIntl } from '@umijs/max';
import { Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import type { PromptTemplateFormValues } from '../usePromptTemplateList';

type KeyOption = {
  value: string;
  label: string;
};

type CreatePromptTemplateModalProps = {
  open: boolean;
  submitting: boolean;
  form: ReturnType<typeof Form.useForm<PromptTemplateFormValues>>[0];
  keyOptions: KeyOption[];
  keysLoading?: boolean;
  agentOptions: Array<{ value: number; label: string }>;
  agentsLoading?: boolean;
  onKeyChange: (key: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

const CreatePromptTemplateModal: React.FC<CreatePromptTemplateModalProps> = ({
  open,
  submitting,
  form,
  keyOptions,
  keysLoading = false,
  agentOptions,
  agentsLoading = false,
  onKeyChange,
  onCancel,
  onSubmit,
}) => {
  const intl = useIntl();
  const keysEmpty = !keysLoading && keyOptions.length === 0;

  return (
    <Modal
      title={intl.formatMessage({ id: 'promptTemplate.createTitle' })}
      open={open}
      width={720}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={submitting}
      okButtonProps={{ disabled: keysEmpty }}
      destroyOnClose
    >
      <Form<PromptTemplateFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="key"
          label={intl.formatMessage({ id: 'promptTemplate.form.key' })}
          extra={intl.formatMessage({ id: 'promptTemplate.form.keyHint' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'promptTemplate.form.keyRequired',
              }),
            },
          ]}
        >
          <Select
            className="app-input"
            showSearch
            loading={keysLoading}
            disabled={keysEmpty}
            placeholder={intl.formatMessage({
              id: 'promptTemplate.form.keyPlaceholder',
            })}
            options={keyOptions}
            optionFilterProp="label"
            onChange={(value) => {
              if (typeof value === 'string') {
                onKeyChange(value);
              }
            }}
            notFoundContent={
              keysLoading
                ? null
                : intl.formatMessage({ id: 'promptTemplate.form.keyEmpty' })
            }
          />
        </Form.Item>
        <div className="grid gap-0 md:grid-cols-2 md:gap-x-4">
          <Form.Item
            name="locale"
            label={intl.formatMessage({ id: 'promptTemplate.column.locale' })}
          >
            <Input
              className="app-input"
              placeholder={intl.formatMessage({
                id: 'promptTemplate.filter.localePlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="category"
            label={intl.formatMessage({ id: 'promptTemplate.column.category' })}
          >
            <Input className="app-input" placeholder="platform" />
          </Form.Item>
        </div>
        <Form.Item
          name="appClientId"
          label={intl.formatMessage({ id: 'promptTemplate.form.appClient' })}
          extra={intl.formatMessage({
            id: 'promptTemplate.form.appClientHint',
          })}
        >
          <InputNumber
            className="app-input w-full"
            controls={false}
            min={1}
            placeholder="—"
          />
        </Form.Item>
        <Form.Item
          name="agentId"
          label={intl.formatMessage({ id: 'promptTemplate.form.agent' })}
        >
          <Select
            className="app-input"
            allowClear
            loading={agentsLoading}
            placeholder={intl.formatMessage({
              id: 'promptTemplate.form.agentPlaceholder',
            })}
            options={agentOptions}
          />
        </Form.Item>
        <Form.Item
          name="title"
          label={intl.formatMessage({ id: 'promptTemplate.column.title' })}
        >
          <Input className="app-input" maxLength={128} />
        </Form.Item>
        <Form.Item
          name="description"
          label={intl.formatMessage({
            id: 'promptTemplate.column.description',
          })}
        >
          <Input.TextArea
            className="app-input"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={500}
          />
        </Form.Item>
        <Form.Item
          name="content"
          label={intl.formatMessage({ id: 'promptTemplate.column.content' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'promptTemplate.form.contentRequired',
              }),
            },
          ]}
        >
          <Input.TextArea
            className="app-input font-mono text-xs"
            autoSize={{ minRows: 8, maxRows: 20 }}
          />
        </Form.Item>
        <Form.Item
          name="publish"
          label={intl.formatMessage({ id: 'promptTemplate.form.publish' })}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreatePromptTemplateModal;
