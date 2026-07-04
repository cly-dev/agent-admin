import type { AdminRole } from '@/types/admin-user';
import { useIntl } from '@umijs/max';
import { Form, Input, Modal, Select, Switch } from 'antd';
import type { AdminUserEditorFormValues } from '../useAdminUserList';

type AdminUserFormModalProps = {
  open: boolean;
  submitting?: boolean;
  isEdit?: boolean;
  form: ReturnType<typeof Form.useForm<AdminUserEditorFormValues>>[0];
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
};

const ROLE_OPTIONS: AdminRole[] = ['SUPER_ADMIN', 'OPERATOR', 'VIEWER'];

const AdminUserFormModal: React.FC<AdminUserFormModalProps> = ({
  open,
  submitting = false,
  isEdit = false,
  form,
  onCancel,
  onSubmit,
}) => {
  const intl = useIntl();

  return (
    <Modal
      title={intl.formatMessage({
        id: isEdit ? 'adminUser.editTitle' : 'adminUser.createTitle',
      })}
      open={open}
      onCancel={onCancel}
      onOk={() => void onSubmit()}
      confirmLoading={submitting}
      destroyOnClose
      width={480}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="email"
          label={intl.formatMessage({ id: 'adminUser.column.email' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'adminUser.form.emailRequired',
              }),
            },
            {
              type: 'email',
              message: intl.formatMessage({
                id: 'adminUser.form.emailInvalid',
              }),
            },
          ]}
        >
          <Input
            className="app-input"
            placeholder={intl.formatMessage({
              id: 'adminUser.form.emailPlaceholder',
            })}
          />
        </Form.Item>
        <Form.Item
          name="username"
          label={intl.formatMessage({ id: 'adminUser.column.username' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'adminUser.form.usernameRequired',
              }),
            },
          ]}
        >
          <Input
            className="app-input"
            placeholder={intl.formatMessage({
              id: 'adminUser.form.usernamePlaceholder',
            })}
          />
        </Form.Item>
        <Form.Item
          name="role"
          label={intl.formatMessage({ id: 'adminUser.column.role' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'adminUser.form.roleRequired',
              }),
            },
          ]}
        >
          <Select
            className="app-select"
            options={ROLE_OPTIONS.map((role) => ({
              value: role,
              label: intl.formatMessage({ id: `adminUser.role.${role}` }),
            }))}
          />
        </Form.Item>
        <Form.Item
          name="isActive"
          label={intl.formatMessage({ id: 'adminUser.column.status' })}
          valuePropName="checked"
        >
          <Switch
            checkedChildren={intl.formatMessage({
              id: 'adminUser.status.active',
            })}
            unCheckedChildren={intl.formatMessage({
              id: 'adminUser.status.inactive',
            })}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AdminUserFormModal;
