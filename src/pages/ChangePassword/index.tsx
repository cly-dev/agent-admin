import omnixLogo from '@/assets/logo/omnix_final_italic.png';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { fetchCurrentAdminUser } from '@/services/auth/user';
import { getDefaultAppPath } from '@/utils/project-nav';
import { history, useIntl, useModel } from '@umijs/max';
import ChangePasswordForm from './components/ChangePasswordForm';
import styles from './index.module.scss';

const ChangePasswordPage: React.FC = () => {
  const intl = useIntl();
  const { restoreLoginSession } = useModel('global');

  const handleSuccess = async (): Promise<void> => {
    await fetchCurrentAdminUser();
    restoreLoginSession();
    history.replace(getDefaultAppPath('dashboard'));
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
        <section className={styles.formPanel}>
          <div className={styles.formInner}>
            <div className={styles.formHead}>
              <div className={styles.formLogoWrap}>
                <img src={omnixLogo} alt="omnix" className={styles.formLogo} />
              </div>
              <header className={styles.cardHead}>
                <h1 className={styles.title}>
                  {intl.formatMessage({ id: 'changePassword.title' })}
                </h1>
                <p className={styles.subtitle}>
                  {intl.formatMessage({ id: 'changePassword.subtitle' })}
                </p>
              </header>
            </div>

            <ChangePasswordForm onSuccess={handleSuccess} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default ChangePasswordPage;
