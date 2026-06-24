import { AppQuerySelect } from '@/components/AppQueryPanel';
import { useIntl } from '@umijs/max';
import { Form, Modal } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { EditProjectMemberRoleFormValues } from '../useProjectMembers';

type EditProjectMemberRoleModalProps = {
  open: boolean;
  submitting?: boolean;
  memberName?: string;
  form: FormInstance<EditProjectMemberRoleFormValues>;
  roleOptions: { value: number; label: string }[];
  onCancel: () => void;
  onSubmit: () => void;
};

const EditProjectMemberRoleModal: React.FC<EditProjectMemberRoleModalProps> = ({
  open,
  submitting = false,
  memberName,
  form,
  roleOptions,
  onCancel,
  onSubmit,
}) => {
  const intl = useIntl();
  const selectPlaceholder = intl.formatMessage({
    id: 'appQueryPanel.selectPlaceholder',
  });

  return (
    <Modal
      className="app-modal"
      title={intl.formatMessage({ id: 'project.members.editRoleTitle' })}
      open={open}
      destroyOnClose
      okText={intl.formatMessage({ id: 'common.save' })}
      cancelText={intl.formatMessage({ id: 'common.cancel' })}
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <p className="mb-4 text-sm text-on-surface/55">
        {intl.formatMessage(
          { id: 'project.members.editRoleHint' },
          { name: memberName || '—' },
        )}
      </p>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="roleId"
          label={intl.formatMessage({ id: 'project.members.field.role' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'project.members.field.roleRequired',
              }),
            },
          ]}
        >
          <AppQuerySelect
            showSearch
            optionFilterProp="label"
            options={roleOptions}
            placeholder={selectPlaceholder}
            notFoundContent={intl.formatMessage({
              id: 'project.members.noRoles',
            })}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProjectMemberRoleModal;
