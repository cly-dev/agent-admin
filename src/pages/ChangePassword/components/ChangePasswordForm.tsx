import { changePassword } from '@/services/auth/user';
import { useIntl } from '@umijs/max';
import { Form, Input } from 'antd';
import { useState } from 'react';
import styles from './index.module.scss';

export type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ChangePasswordFormProps = {
  requireCurrentPassword?: boolean;
  onSuccess?: () => void | Promise<void>;
  submitLabel?: string;
};

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  requireCurrentPassword = true,
  onSuccess,
  submitLabel,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm<ChangePasswordFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (
    values: ChangePasswordFormValues,
  ): Promise<void> => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      form.resetFields();
      await onSuccess?.();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'changePassword.failed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form<ChangePasswordFormValues>
      form={form}
      layout="vertical"
      requiredMark={false}
      className={styles.form}
      onFinish={(values) => void handleSubmit(values)}
      onValuesChange={() => {
        if (errorMessage) {
          setErrorMessage('');
        }
      }}
    >
      {requireCurrentPassword ? (
        <Form.Item
          name="currentPassword"
          label={intl.formatMessage({ id: 'changePassword.currentPassword' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'changePassword.currentPasswordRequired',
              }),
            },
          ]}
        >
          <Input.Password
            className="app-input"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </Form.Item>
      ) : null}

      <Form.Item
        name="newPassword"
        label={intl.formatMessage({ id: 'changePassword.newPassword' })}
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'changePassword.newPasswordRequired',
            }),
          },
          {
            min: 6,
            message: intl.formatMessage({
              id: 'changePassword.newPasswordMin',
            }),
          },
        ]}
      >
        <Input.Password
          className="app-input"
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label={intl.formatMessage({ id: 'changePassword.confirmPassword' })}
        dependencies={['newPassword']}
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'changePassword.confirmPasswordRequired',
            }),
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error(
                  intl.formatMessage({ id: 'changePassword.passwordMismatch' }),
                ),
              );
            },
          }),
        ]}
      >
        <Input.Password
          className="app-input"
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </Form.Item>

      {errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button type="submit" className={styles.submit} disabled={submitting}>
        {submitting
          ? intl.formatMessage({ id: 'changePassword.submitting' })
          : (submitLabel ??
            intl.formatMessage({ id: 'changePassword.submit' }))}
      </button>
    </Form>
  );
};

export default ChangePasswordForm;
