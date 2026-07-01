import omnixLogo from '@/assets/logo/omnix_final_italic.png';
import OmnixCanvasLogo from './components/OmnixCanvasLogo';
import LoginField from './components/LoginField';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { signIn } from '@/services/auth/user';
import { getDefaultAppPath } from '@/utils/project-nav';
import { history, useIntl, useModel } from '@umijs/max';
import { Form } from 'antd';
import { useState } from 'react';
import styles from './index.module.scss';

type LoginFormValues = {
  email: string;
  password: string;
};

const LoginPage: React.FC = () => {
  const intl = useIntl();
  const { saveLoginSession } = useModel('global');
  const { refreshProjects } = useModel('project');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (values: LoginFormValues): Promise<void> => {
    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = await signIn(values.email, values.password);

      saveLoginSession(payload);
      await refreshProjects();
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
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden>
        <div className={styles.bgGlowTop} />
        <div className={styles.bgGlowBottom} />
        <div className={styles.bgGrid} />
      </div>

      <div className={styles.locale}>
        <LocaleSwitcher />
      </div>

      <main className={styles.layout}>
        <aside className={styles.brandPanel}>
          <div className={styles.brandInner}>
            <OmnixCanvasLogo />
            <p className={styles.brandCaption}>
              {intl.formatMessage({ id: 'login.brandCaption' })}
            </p>
          </div>
        </aside>

        <section
          className={styles.formPanel}
          aria-label={intl.formatMessage({ id: 'login.signIn' })}
        >
          <div className={styles.formInner}>
            <div className={styles.formHead}>
              <div className={styles.formLogoWrap}>
                <img src={omnixLogo} alt="omnix" className={styles.formLogo} />
              </div>

              <header className={styles.cardHead}>
                <h1 className={styles.welcome}>
                  {intl.formatMessage({ id: 'login.welcome' })}
                </h1>
                <p className={styles.subtitle}>
                  {intl.formatMessage({ id: 'login.subtitle' })}
                </p>
              </header>
            </div>

            <Form<LoginFormValues>
              layout="vertical"
              requiredMark={false}
              className={styles.form}
              onFinish={handleSubmit}
              onValuesChange={() => {
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
            >
              <LoginField
                name="email"
                id="login-email"
                label={intl.formatMessage({ id: 'login.email' })}
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({ id: 'login.emailRequired' }),
                  },
                  {
                    type: 'email',
                    message: intl.formatMessage({ id: 'login.emailInvalid' }),
                  },
                ]}
              />

              <LoginField
                name="password"
                id="login-password"
                label={intl.formatMessage({ id: 'login.password' })}
                password
                placeholder="••••••••"
                autoComplete="current-password"
                headerExtra={
                  <button type="button" className={styles.forgot}>
                    {intl.formatMessage({ id: 'login.forgotPassword' })}
                  </button>
                }
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'login.passwordRequired',
                    }),
                  },
                ]}
              />

              {errorMessage ? (
                <p className={styles.error} role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                className={styles.submit}
                disabled={submitting}
              >
                {submitting
                  ? intl.formatMessage({ id: 'login.signingIn' })
                  : intl.formatMessage({ id: 'login.signIn' })}
              </button>
            </Form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
