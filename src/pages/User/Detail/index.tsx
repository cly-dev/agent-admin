import { AppDetailPage } from '@/components/AppDetailHeader';
import {
  AppstoreOutlined,
  IdcardOutlined,
  MailOutlined,
  NumberOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { history, useIntl, useParams } from '@umijs/max';
import { Button, Empty, Table } from 'antd';
import { useMemo } from 'react';
import styles from './index.module.scss';
import { useUserDetail } from './useUserDetail';

function userInitial(username?: string, email?: string): string {
  const source = (username?.trim() || email?.trim() || '?')[0];
  return source.toUpperCase();
}

const UserDetailPage: React.FC = () => {
  const intl = useIntl();
  const params = useParams<{ id?: string }>();
  const userId = useMemo(() => Number(params.id), [params.id]);

  const { user, loading, submitting, assignedSystems, updateStatus } =
    useUserDetail(userId);

  const pageTitle = user
    ? user.username || user.email
    : intl.formatMessage({ id: 'user.detail.title' });

  const subtitleParts = user
    ? [
        `ID ${user.id}`,
        user.employeeId
          ? `${intl.formatMessage({ id: 'user.column.employeeId' })} ${user.employeeId}`
          : null,
      ].filter(Boolean)
    : [];

  return (
    <AppDetailPage
      loading={loading}
      pageClassName={styles.userDetailPage}
      onBack={() => history.push('/user/list')}
      title={pageTitle}
      subtitle={subtitleParts.length ? subtitleParts.join(' · ') : undefined}
      extraActions={
        user ? (
          <>
            <Button
              type="default"
              disabled={submitting || user.status === 'ACTIVE'}
              onClick={() => void updateStatus('ACTIVE')}
            >
              {intl.formatMessage({ id: 'user.action.enable' })}
            </Button>
            <Button
              danger
              disabled={submitting || user.status === 'DISABLED'}
              onClick={() => void updateStatus('DISABLED')}
            >
              {intl.formatMessage({ id: 'user.action.disable' })}
            </Button>
          </>
        ) : null
      }
    >
      {!user && !loading ? (
        <Empty
          description={intl.formatMessage({ id: 'user.detail.notFound' })}
        />
      ) : user ? (
        <div className={styles.pageBody}>
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar} aria-hidden>
              {userInitial(user.username, user.email)}
            </div>
            <div className={styles.profileMain}>
              <p className={styles.profileName}>
                {user.username || user.email}
              </p>
              <p className={styles.profileEmail}>
                <MailOutlined />
                <span>{user.email}</span>
              </p>
              <div className={styles.profileChips}>
                <span className={styles.profileChip}>
                  <NumberOutlined />
                  ID {user.id}
                </span>
                {user.employeeId ? (
                  <span className={styles.profileChip}>
                    <IdcardOutlined />
                    {user.employeeId}
                  </span>
                ) : null}
                <span
                  className={`${styles.profileChip} ${
                    user.status === 'DISABLED' ? '' : styles.profileChipRole
                  }`}
                >
                  <SafetyCertificateOutlined />
                  {intl.formatMessage({
                    id:
                      user.status === 'DISABLED'
                        ? 'status.inactive'
                        : 'status.active',
                  })}
                </span>
              </div>
            </div>
            <div className={styles.profileStat}>
              <span className={styles.profileStatValue}>
                {assignedSystems.length}
              </span>
              <span className={styles.profileStatLabel}>
                {intl.formatMessage({ id: 'user.detail.systemCount' })}
              </span>
            </div>
          </div>

          <div className={styles.contentGrid}>
            <section className={styles.panel}>
              <header className={styles.panelHeader}>
                <span
                  className={`${styles.panelIcon} ${styles.panelIconBasic}`}
                >
                  <UserOutlined />
                </span>
                <div>
                  <h2 className={styles.panelTitle}>
                    {intl.formatMessage({ id: 'user.detail.section.basic' })}
                  </h2>
                  <p className={styles.panelHint}>
                    {intl.formatMessage({
                      id: 'user.detail.section.basicHint',
                    })}
                  </p>
                </div>
              </header>
              <dl className={styles.infoGrid}>
                <div className={styles.infoTile}>
                  <dt>
                    <NumberOutlined />
                    {intl.formatMessage({ id: 'user.column.id' })}
                  </dt>
                  <dd>{user.id}</dd>
                </div>
                <div className={styles.infoTile}>
                  <dt>
                    <IdcardOutlined />
                    {intl.formatMessage({ id: 'user.column.employeeId' })}
                  </dt>
                  <dd>{user.employeeId || '—'}</dd>
                </div>
                <div className={styles.infoTile}>
                  <dt>
                    <UserOutlined />
                    {intl.formatMessage({ id: 'user.column.username' })}
                  </dt>
                  <dd>{user.username || '—'}</dd>
                </div>
                <div className={styles.infoTile}>
                  <dt>
                    <MailOutlined />
                    {intl.formatMessage({ id: 'user.column.email' })}
                  </dt>
                  <dd className={styles.infoTileMono}>{user.email || '—'}</dd>
                </div>
              </dl>
            </section>

            <div className={styles.sideStack}>
              <section className={styles.panel}>
                <header className={styles.panelHeader}>
                  <span
                    className={`${styles.panelIcon} ${styles.panelIconSystems}`}
                  >
                    <AppstoreOutlined />
                  </span>
                  <div>
                    <h2 className={styles.panelTitle}>
                      {intl.formatMessage({
                        id: 'user.detail.section.systems',
                      })}
                    </h2>
                    <p className={styles.panelHint}>
                      {intl.formatMessage({
                        id: 'user.detail.section.systemsReadonlyHint',
                      })}
                    </p>
                  </div>
                </header>
                {assignedSystems.length === 0 ? (
                  <div className={styles.systemsEmpty}>
                    <AppstoreOutlined className={styles.systemsEmptyIcon} />
                    <p>
                      {intl.formatMessage({
                        id: 'user.detail.membership.empty',
                      })}
                    </p>
                  </div>
                ) : (
                  <Table
                    size="small"
                    pagination={false}
                    rowKey={(record) =>
                      `${record.appId}-${record.roleName ?? 'unknown'}`
                    }
                    dataSource={assignedSystems}
                    columns={[
                      {
                        title: intl.formatMessage({
                          id: 'user.detail.membership.appColumn',
                        }),
                        dataIndex: 'name',
                      },
                      {
                        title: intl.formatMessage({
                          id: 'user.detail.membership.roleColumn',
                        }),
                        dataIndex: 'roleName',
                        render: (value: string | undefined) =>
                          value ||
                          intl.formatMessage({
                            id: 'user.detail.membership.roleEmpty',
                          }),
                      },
                    ]}
                  />
                )}
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </AppDetailPage>
  );
};

export default UserDetailPage;
