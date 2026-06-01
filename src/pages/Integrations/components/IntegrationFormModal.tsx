import { useAuthModeOptions } from '@/hooks/useAuthModeOptions';
import type { Integration, IntegrationAuthMode } from '@/types/integration';
import { ModalForm, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import { DEFAULT_AUTH_MODE, type IntegrationFormValues } from '../useIntegrations';

export type { IntegrationFormValues };

type IntegrationFormModalProps = {
  open: boolean;
  editing: Integration | null;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: IntegrationFormValues) => Promise<boolean>;
};

const IntegrationFormModal: React.FC<IntegrationFormModalProps> = ({
  open,
  editing,
  submitting = false,
  onOpenChange,
  onSubmit,
}) => {
  const intl = useIntl();
  const authModeOptions = useAuthModeOptions();
  const isEditing = Boolean(editing);
  const title = isEditing
    ? intl.formatMessage({ id: 'integration.form.configure' })
    : intl.formatMessage({ id: 'integration.form.add' });

  return (
    <ModalForm<IntegrationFormValues>
      title={
        <div className="app-modal-title-block">
          <div className="app-modal-title">{title}</div>
          <p className="app-modal-subtitle">
            {intl.formatMessage({ id: 'integration.form.subtitle' })}
          </p>
        </div>
      }
      open={open}
      width={560}
      modalProps={{
        centered: true,
        destroyOnClose: true,
        maskClosable: !submitting,
        closable: !submitting,
        onCancel: () => onOpenChange(false),
      }}
      onOpenChange={onOpenChange}
      initialValues={
        editing
          ? {
              name: editing.name,
              description: editing.description ?? '',
              baseUrl: editing.baseUrl,
              authMode: editing.authMode,
            }
          : { authMode: DEFAULT_AUTH_MODE as IntegrationAuthMode, description: '' }
      }
      submitter={{
        render: (_, dom) => [
          <Button key="cancel" disabled={submitting} onClick={() => onOpenChange(false)}>
            {intl.formatMessage({ id: 'common.cancel' })}
          </Button>,
          dom[1],
        ],
        submitButtonProps: {
          loading: submitting,
          children: isEditing
            ? intl.formatMessage({ id: 'common.configure' })
            : intl.formatMessage({ id: 'integration.add' }),
        },
      }}
      onFinish={onSubmit}
    >
      <ProFormText
        name="name"
        label={intl.formatMessage({ id: 'integration.form.name' })}
        placeholder={intl.formatMessage({ id: 'integration.form.namePlaceholder' })}
        rules={[{ required: true, message: intl.formatMessage({ id: 'integration.form.nameRequired' }) }]}
      />
      <ProFormTextArea
        name="description"
        label={intl.formatMessage({ id: 'integration.form.description' })}
        placeholder={intl.formatMessage({ id: 'integration.form.descriptionPlaceholder' })}
        fieldProps={{
          rows: 3,
          showCount: true,
          maxLength: 200,
        }}
      />
      <ProFormText
        name="baseUrl"
        label={intl.formatMessage({ id: 'integration.form.baseUrl' })}
        placeholder="https://api.example.com"
        rules={[
          { required: true, message: intl.formatMessage({ id: 'integration.form.baseUrlRequired' }) },
          { type: 'url', message: intl.formatMessage({ id: 'integration.form.baseUrlInvalid' }) },
        ]}
      />
      <ProFormSelect
        name="authMode"
        label={intl.formatMessage({ id: 'integration.form.authMode' })}
        options={authModeOptions}
        rules={[
          { required: true, message: intl.formatMessage({ id: 'integration.form.authModeRequired' }) },
        ]}
      />
      <ProFormText.Password
        name="apiKey"
        label={intl.formatMessage({ id: 'integration.form.apiKey' })}
        placeholder={
          isEditing
            ? intl.formatMessage({ id: 'integration.form.apiKeyPlaceholderEdit' })
            : intl.formatMessage({ id: 'integration.form.apiKeyPlaceholder' })
        }
      />
    </ModalForm>
  );
};

export default IntegrationFormModal;
