import { CopyOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert, Modal, Typography, message } from 'antd';
import type { GeneratedPasswordPayload } from '../useAdminUserList';

type AdminUserGeneratedPasswordModalProps = {
  payload: GeneratedPasswordPayload | null;
  onClose: () => void;
};

const AdminUserGeneratedPasswordModal: React.FC<
  AdminUserGeneratedPasswordModalProps
> = ({ payload, onClose }) => {
  const intl = useIntl();

  const copyPassword = async () => {
    if (!payload?.generatedPassword) {
      return;
    }
    try {
      await navigator.clipboard.writeText(payload.generatedPassword);
      message.success(intl.formatMessage({ id: 'adminUser.passwordCopied' }));
    } catch {
      message.error(intl.formatMessage({ id: 'adminUser.passwordCopyFailed' }));
    }
  };

  return (
    <Modal
      title={intl.formatMessage({ id: 'adminUser.generatedPasswordTitle' })}
      open={Boolean(payload)}
      onCancel={onClose}
      onOk={onClose}
      okText={intl.formatMessage({ id: 'common.close' })}
      cancelButtonProps={{ style: { display: 'none' } }}
      width={520}
    >
      {payload ? (
        <>
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message={intl.formatMessage({
              id: 'adminUser.generatedPasswordWarning',
            })}
          />
          <p className="mb-2 text-sm text-on-surface/70">
            {intl.formatMessage(
              { id: 'adminUser.generatedPasswordHint' },
              { email: payload.email, username: payload.username },
            )}
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2">
            <Typography.Text code className="flex-1 break-all">
              {payload.generatedPassword}
            </Typography.Text>
            <button
              type="button"
              className="app-button-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
              onClick={() => void copyPassword()}
            >
              <CopyOutlined />
              {intl.formatMessage({ id: 'adminUser.copyPassword' })}
            </button>
          </div>
        </>
      ) : null}
    </Modal>
  );
};

export default AdminUserGeneratedPasswordModal;
