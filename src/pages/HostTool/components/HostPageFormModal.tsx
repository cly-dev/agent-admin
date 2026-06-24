import { useIntl } from '@umijs/max';
import { Form, Input, Modal, Switch } from 'antd';
import type { HostPageFormValues } from '../useHostPageList';

type HostPageFormModalProps = {
  open: boolean;
  submitting?: boolean;
  editing?: { id: number; label: string } | null;
  form: ReturnType<typeof Form.useForm<HostPageFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void;
};

const HostPageFormModal: React.FC<HostPageFormModalProps> = ({
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
        id: editing ? 'hostPage.form.editTitle' : 'hostPage.form.createTitle',
      })}
      okText={intl.formatMessage({
        id: editing ? 'common.save' : 'hostPage.form.createSubmit',
      })}
      cancelText={intl.formatMessage({ id: 'common.cancel' })}
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={onSubmit}
      width={560}
      destroyOnClose
    >
      <Form<HostPageFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="scope"
          label={intl.formatMessage({ id: 'hostPage.column.scope' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'hostPage.form.scopeRequired',
              }),
            },
          ]}
        >
          <Input className="app-input" placeholder="review-detail" />
        </Form.Item>
        <Form.Item
          name="label"
          label={intl.formatMessage({ id: 'hostPage.column.label' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'hostPage.form.labelRequired',
              }),
            },
          ]}
        >
          <Input
            className="app-input"
            placeholder={intl.formatMessage({
              id: 'hostPage.form.labelPlaceholder',
            })}
          />
        </Form.Item>
        <Form.Item
          name="routePattern"
          label={intl.formatMessage({ id: 'hostPage.column.routePattern' })}
        >
          <Input className="app-input" placeholder="/reviews/:id" />
        </Form.Item>
        <Form.Item
          name="description"
          label={intl.formatMessage({ id: 'hostPage.column.description' })}
        >
          <Input.TextArea
            className="app-input"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
        <Form.Item
          name="isActive"
          label={intl.formatMessage({ id: 'hostPage.column.isActive' })}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default HostPageFormModal;
