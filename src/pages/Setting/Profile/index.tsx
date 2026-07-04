import ListPageHeader from '@/components/ListPageHeader';
import { fetchCurrentAdminUser } from '@/services/auth/user';
import type { AdminUserProfile } from '@/types/admin-user';
import { getAdminRoleLabelKey } from '@/utils/admin-role';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useModel } from '@umijs/max';
import { Descriptions, Spin, Tag } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import ChangePasswordForm from '../../ChangePassword/components/ChangePasswordForm';
import styles from './index.module.scss';

const SettingProfilePage: React.FC = () => {
  const intl = useIntl();
  const { restoreLoginSession } = useModel('global');
  const [profile, setProfile] = useState<AdminUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const user = await fetchCurrentAdminUser();
      setProfile({
        id: user.id,
        employeeId: user.employeeId ?? String(user.id),
        email: user.email,
        username: user.username,
        nickName: user.nickName ?? user.username,
        role: user.role ?? 'VIEWER',
        active: user.isActive ?? true,
        mustChangePassword: Boolean(user.mustChangePassword),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handlePasswordChanged = async (): Promise<void> => {
    restoreLoginSession();
    await loadProfile();
  };

  return (
    <PageContainer ghost className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.card}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'setting.profile.title' })}
            description={intl.formatMessage({ id: 'setting.profile.subtitle' })}
          />

          <Spin spinning={loading}>
            {profile ? (
              <Descriptions
                bordered
                size="small"
                column={{ xs: 1, sm: 2 }}
                className={styles.profileDescriptions}
              >
                <Descriptions.Item
                  label={intl.formatMessage({
                    id: 'adminUser.column.username',
                  })}
                >
                  {profile.username}
                </Descriptions.Item>
                <Descriptions.Item
                  label={intl.formatMessage({ id: 'adminUser.column.email' })}
                >
                  {profile.email}
                </Descriptions.Item>
                <Descriptions.Item
                  label={intl.formatMessage({ id: 'adminUser.column.role' })}
                >
                  <Tag color="blue">
                    {intl.formatMessage({
                      id: getAdminRoleLabelKey(profile.role),
                    })}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item
                  label={intl.formatMessage({ id: 'adminUser.column.status' })}
                >
                  <Tag color={profile.active ? 'success' : 'default'}>
                    {profile.active
                      ? intl.formatMessage({ id: 'adminUser.status.active' })
                      : intl.formatMessage({ id: 'adminUser.status.inactive' })}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item
                  label={intl.formatMessage({
                    id: 'setting.profile.employeeId',
                  })}
                >
                  {profile.employeeId}
                </Descriptions.Item>
                <Descriptions.Item
                  label={intl.formatMessage({ id: 'setting.profile.nickName' })}
                >
                  {profile.nickName}
                </Descriptions.Item>
              </Descriptions>
            ) : null}
          </Spin>

          <section className={styles.passwordSection}>
            <h2 className={styles.sectionTitle}>
              {intl.formatMessage({
                id: 'setting.profile.changePasswordTitle',
              })}
            </h2>
            <p className={styles.sectionHint}>
              {intl.formatMessage({ id: 'setting.profile.changePasswordHint' })}
            </p>
            <div className={styles.passwordFormWrap}>
              <ChangePasswordForm onSuccess={handlePasswordChanged} />
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
};

export default SettingProfilePage;
