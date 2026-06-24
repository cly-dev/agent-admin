import type { HostToolExposure } from '@/types/host-tool';
import { useIntl } from '@umijs/max';
import { Form, Input, Modal, Select, Switch } from 'antd';
import type { HostToolFormValues } from '../useHostToolList';

type HostToolFormModalProps = {
  open: boolean;
  submitting?: boolean;
  editing?: { id: number; name: string } | null;
  form: ReturnType<typeof Form.useForm<HostToolFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void;
};

const EXPOSURE_OPTIONS: HostToolExposure[] = [
  'CATALOG',
  'ON_COMPLETE',
  'LLM',
  'BOTH',
];

const HostToolFormModal: React.FC<HostToolFormModalProps> = ({
  open,
  submitting = false,
  editing,
  form,
  onCancel,
  onSubmit,
}) => {
  const intl = useIntl();

  return (
    <Modal
      open={open}
      title={intl.formatMessage({
        id: editing ? 'hostTool.form.editTitle' : 'hostTool.form.createTitle',
      })}
      okText={intl.formatMessage({
        id: editing ? 'common.save' : 'hostTool.form.createSubmit',
      })}
      cancelText={intl.formatMessage({ id: 'common.cancel' })}
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={onSubmit}
      width={640}
      destroyOnClose
    >
      <Form<HostToolFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <Form.Item
            name="name"
            label={intl.formatMessage({ id: 'hostTool.column.name' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'hostTool.form.nameRequired',
                }),
              },
            ]}
          >
            <Input className="app-input" placeholder="refreshEntity" />
          </Form.Item>
          <Form.Item
            name="definitionKey"
            label={intl.formatMessage({ id: 'hostTool.column.definitionKey' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'hostTool.form.definitionKeyRequired',
                }),
              },
            ]}
          >
            <Input className="app-input" placeholder="refreshEntity" />
          </Form.Item>
        </div>
        <Form.Item
          name="description"
          label={intl.formatMessage({ id: 'hostTool.column.description' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'hostTool.form.descriptionRequired',
              }),
            },
          ]}
        >
          <Input.TextArea
            className="app-input"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
        <Form.Item
          name="exposure"
          label={intl.formatMessage({ id: 'hostTool.column.exposure' })}
          rules={[{ required: true }]}
        >
          <Select
            className="app-input"
            options={EXPOSURE_OPTIONS.map((value) => ({
              value,
              label: intl.formatMessage({ id: `hostTool.exposure.${value}` }),
            }))}
          />
        </Form.Item>
        <Form.Item
          name="argsSchemaJson"
          label={intl.formatMessage({ id: 'hostTool.form.argsSchema' })}
          extra={intl.formatMessage({ id: 'hostTool.form.argsSchemaHint' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'hostTool.form.argsSchemaRequired',
              }),
            },
          ]}
        >
          <Input.TextArea
            className="app-input font-mono text-xs"
            autoSize={{ minRows: 6, maxRows: 12 }}
          />
        </Form.Item>
        <Form.Item
          name="argsTemplateJson"
          label={intl.formatMessage({ id: 'hostTool.form.argsTemplate' })}
          extra={intl.formatMessage({ id: 'hostTool.form.argsTemplateHint' })}
        >
          <Input.TextArea
            className="app-input font-mono text-xs"
            autoSize={{ minRows: 4, maxRows: 10 }}
          />
        </Form.Item>
        <Form.Item
          name="isActive"
          label={intl.formatMessage({ id: 'hostTool.column.isActive' })}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default HostToolFormModal;
