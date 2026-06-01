import { UserController_findOne } from '@/services/user';
import type { User } from '@/types/user';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl, useParams } from '@umijs/max';
import { Descriptions, Empty, Spin, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

const UserDetailPage: React.FC = () => {
  const intl = useIntl();
  const params = useParams<{ id?: string }>();
  const userId = useMemo(() => Number(params.id), [params.id]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!Number.isFinite(userId) || userId <= 0) {
      setUser(null);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const detail = await UserController_findOne(userId);
        setUser(detail);
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : intl.formatMessage({ id: 'user.loadFailed' }));
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [intl, userId]);

  return (
    <PageContainer ghost>
      <div className="p-4">
        <div className="rounded-[--radius-ui] bg-surface-container-lowest p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm text-on-surface/60 hover:text-primary"
              onClick={() => history.push('/user')}
            >
              <ArrowLeftOutlined />
              {intl.formatMessage({ id: 'user.detail.back' })}
            </button>
            <h1 className="m-0 text-lg font-semibold text-on-surface">
              {intl.formatMessage({ id: 'user.detail.title' })}
            </h1>
          </div>

          <Spin spinning={loading}>
            {!user ? (
              <Empty description={intl.formatMessage({ id: 'user.detail.notFound' })} />
            ) : (
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: 'user.column.username' })}>
                  {user.username || '—'}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: 'user.column.userEmail' })}>
                  {user.email || '—'}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: 'user.detail.employeeId' })}>
                  {user.employeeId || '—'}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: 'user.detail.userType' })}>
                  {user.userType || '—'}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: 'user.detail.userRole' })}>
                  {user.userRole || user.role || '—'}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: 'user.column.updatedAt' })}>
                  {user.updatedAt || '—'}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: 'user.detail.createdAt' })}>
                  {user.createdAt || '—'}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Spin>
        </div>
      </div>
    </PageContainer>
  );
};

export default UserDetailPage;
