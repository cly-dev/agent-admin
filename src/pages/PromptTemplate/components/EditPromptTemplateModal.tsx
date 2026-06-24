import type { PromptTemplateVersion } from '@/types/prompt-template';
import { useIntl } from '@umijs/max';
import { Form, Input, Modal } from 'antd';
import type { UpdatePromptTemplateFormValues } from '../usePromptTemplateList';

type EditPromptTemplateModalProps = {
  open: boolean;
  submitting: boolean;
  editing: PromptTemplateVersion | null;
  form: ReturnType<typeof Form.useForm<UpdatePromptTemplateFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void;
};

const EditPromptTemplateModal: React.FC<EditPromptTemplateModalProps> = ({
  open,
  submitting,
  editing,
  form,
  onCancel,
  onSubmit,
}) => {
  const intl = useIntl();

  return (
    <Modal
      title={intl.formatMessage({ id: 'promptTemplate.editTitle' })}
      open={open}
      width={720}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={submitting}
      destroyOnClose
    >
      {editing ? (
        <div className="mb-4 rounded-[--radius-ui] bg-surface-container-low px-3 py-2 text-xs text-on-surface/65">
          <div>
            <span className="font-semibold">
              {intl.formatMessage({ id: 'promptTemplate.column.key' })}:
            </span>{' '}
            {editing.key}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {intl.formatMessage({ id: 'promptTemplate.column.locale' })}:{' '}
              {editing.locale || '—'}
            </span>
            <span>
              {intl.formatMessage({ id: 'promptTemplate.column.version' })}:{' '}
              {editing.version !== undefined ? `v${editing.version}` : '—'}
            </span>
            <span>
              {intl.formatMessage({ id: 'promptTemplate.column.isActive' })}:{' '}
              {editing.isActive
                ? intl.formatMessage({ id: 'promptTemplate.status.active' })
                : intl.formatMessage({ id: 'promptTemplate.status.inactive' })}
            </span>
          </div>
          <p className="mt-2 text-on-surface/50">
            {intl.formatMessage({ id: 'promptTemplate.edit.scopeHint' })}
          </p>
        </div>
      ) : null}

      <Form<UpdatePromptTemplateFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="category"
          label={intl.formatMessage({ id: 'promptTemplate.column.category' })}
        >
          <Input className="app-input" placeholder="platform" />
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
      </Form>
    </Modal>
  );
};

export default EditPromptTemplateModal;
