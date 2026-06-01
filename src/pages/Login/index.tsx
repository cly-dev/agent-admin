import LocaleSwitcher from '@/components/LocaleSwitcher';
import { signIn } from '@/services/auth/user';
import { resolveDefaultProjectId, getDefaultAppPath } from '@/utils/project-nav';
import '@/global.css';
import { RobotOutlined } from '@ant-design/icons';
import { history, useIntl, useModel } from '@umijs/max';
import { Form, Input } from 'antd';
import { useState } from 'react';

type LoginFormValues = {
  email: string;
  password: string;
};

const LoginPage: React.FC = () => {
  const intl = useIntl();
  const { saveLoginSession } = useModel('global');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (values: LoginFormValues): Promise<void> => {
    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = await signIn(values.email, values.password);

      saveLoginSession(payload);
      await resolveDefaultProjectId();
      history.push(getDefaultAppPath('dashboard'));
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(intl.formatMessage({ id: 'login.failed' }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-surface text-on-surface">
      <header className="fixed top-0 z-50 w-full app-frosted-header">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[--radius-ui] bg-linear-to-br from-primary to-primary-container">
              <RobotOutlined className="text-sm text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-on-surface">
              {intl.formatMessage({ id: 'login.brand' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <button type="button" className="app-button-tertiary px-3 py-1 text-sm font-semibold">
              {intl.formatMessage({ id: 'common.support' })}
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-24 pt-24">
        <section className="w-full max-w-md app-floating p-8 md:p-10">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-6 rounded-full bg-surface-container-low p-4">
              <RobotOutlined className="text-4xl text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.01em] text-on-surface">
              {intl.formatMessage({ id: 'login.welcome' })}
            </h1>
            <p className="mt-2 text-sm text-on-surface/70">
              {intl.formatMessage({ id: 'login.subtitle' })}
            </p>
          </div>
          <Form<LoginFormValues>
            layout="vertical"
            requiredMark={false}
            className="space-y-5"
            onFinish={handleSubmit}
            onValuesChange={() => {
              if (errorMessage) {
                setErrorMessage('');
              }
            }}
          >
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-on-surface/70">
                {intl.formatMessage({ id: 'login.email' })}
              </label>
              <Form.Item<LoginFormValues>
                name="email"
                className="mb-0"
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'login.emailRequired' }) },
                  { type: 'email', message: intl.formatMessage({ id: 'login.emailInvalid' }) },
                ]}
              >
                <Input
                  type="email"
                  className="app-input w-full border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:border-primary focus:bg-surface-container-lowest"
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </Form.Item>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-on-surface/70">
                  {intl.formatMessage({ id: 'login.password' })}
                </label>
                <button
                  type="button"
                  className="app-button-tertiary app-button-tertiary-compact cursor-pointer px-2 py-1 font-medium"
                >
                  {intl.formatMessage({ id: 'login.forgotPassword' })}
                </button>
              </div>
              <Form.Item<LoginFormValues>
                name="password"
                className="mb-0"
                rules={[
                  { required: true, message: intl.formatMessage({ id: 'login.passwordRequired' }) },
                ]}
              >
                <Input.Password
                  className="app-input w-full border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm focus:border-primary focus:bg-surface-container-lowest"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Form.Item>
              {errorMessage ? <p className="mt-2 text-xs text-red-500">{errorMessage}</p> : null}
            </div>

            <button
              type="submit"
              className="app-button-primary w-full px-4 py-3 text-sm font-semibold text-white-500 cursor-pointer"
              disabled={submitting}
            >
              {submitting
                ? intl.formatMessage({ id: 'login.signingIn' })
                : intl.formatMessage({ id: 'login.signIn' })}
            </button>
          </Form>
        </section>
      </main>

      <footer className="fixed bottom-0 w-full bg-transparent text-xs text-on-surface/60">
        <div className="flex flex-col items-center justify-between gap-4 px-8 py-6 md:flex-row">
          <p>{intl.formatMessage({ id: 'login.footer' })}</p>
          <div className="flex gap-6">
            <button type="button" className="app-button-tertiary px-0 py-0 text-xs">
              {intl.formatMessage({ id: 'login.privacy' })}
            </button>
            <button type="button" className="app-button-tertiary px-0 py-0 text-xs">
              {intl.formatMessage({ id: 'login.terms' })}
            </button>
            <button type="button" className="app-button-tertiary px-0 py-0 text-xs">
              {intl.formatMessage({ id: 'login.security' })}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
