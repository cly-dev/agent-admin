import { AppQuerySelect } from '@/components/AppQueryPanel';
import { useIntl } from '@umijs/max';
import { Form, Modal } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { AddProjectMemberFormValues } from '../useProjectMembers';

type AddProjectMemberModalProps = {
  open: boolean;
  submitting?: boolean;
  form: FormInstance<AddProjectMemberFormValues>;
  userOptions: { value: number; label: string; disabled?: boolean }[];
  roleOptions: { value: number; label: string }[];
  onCancel: () => void;
  onSubmit: () => void;
};

const AddProjectMemberModal: React.FC<AddProjectMemberModalProps> = ({
  open,
  submitting = false,
  form,
  userOptions,
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
      title={intl.formatMessage({ id: 'project.members.addTitle' })}
      open={open}
      destroyOnClose
      okText={intl.formatMessage({ id: 'project.members.addConfirm' })}
      cancelText={intl.formatMessage({ id: 'common.cancel' })}
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={onSubmit}
    >
      <p className="mb-4 text-sm text-on-surface/55">
        {intl.formatMessage({ id: 'project.members.addHint' })}
      </p>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Form.Item
          name="userId"
          label={intl.formatMessage({ id: 'project.members.field.user' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'project.members.field.userRequired',
              }),
            },
          ]}
        >
          <AppQuerySelect
            showSearch
            optionFilterProp="label"
            options={userOptions}
            placeholder={selectPlaceholder}
            notFoundContent={intl.formatMessage({
              id: 'project.members.noUsers',
            })}
          />
        </Form.Item>
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

export default AddProjectMemberModal;
