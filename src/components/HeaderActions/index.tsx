import LocaleSwitcher from '@/components/LocaleSwitcher';
import { getAuthSnapshot, signOut } from '@/services/auth/user';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import { BellOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { history, useIntl, useModel } from '@umijs/max';
import { Avatar, Dropdown, Spin } from 'antd';
import type { MenuProps } from 'antd';
import { useMemo, useState } from 'react';

const getInitial = (name?: string, email?: string): string => {
  const source = name?.trim() || email?.trim() || 'U';
  return source.charAt(0).toUpperCase();
};

const HeaderActions: React.FC = () => {
  const intl = useIntl();
  const { user, clearLoginSession } = useModel('global');
  const { toPagePath } = useProjectRoute();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const displayUser = user ?? getAuthSnapshot().user;

  const menuItems = useMemo<MenuProps['items']>(
    () => [
      {
        key: 'profile',
        label: (
          <div className="py-1">
            <p className="text-sm font-medium text-on-surface">
              {displayUser?.username ?? intl.formatMessage({ id: 'layout.notSignedIn' })}
            </p>
            <p className="text-xs text-on-surface/60">{displayUser?.email ?? '-'}</p>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: intl.formatMessage({ id: 'layout.settings' }),
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: intl.formatMessage({ id: 'layout.signOut' }),
      },
    ],
    [displayUser?.email, displayUser?.username, intl],
  );

  const handleMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key === 'settings') {
      history.push(toPagePath('setting'));
      return;
    }

    if (key !== 'logout' || logoutLoading) {
      return;
    }

    setLogoutLoading(true);
    try {
      await signOut();
      clearLoginSession();
      history.push('/login');
    } finally {
      setLogoutLoading(false);
    }
  };

  if (!displayUser) {
    return <LocaleSwitcher />;
  }

  return (
    <div className="flex shrink-0 items-center gap-2 pl-4">
      <LocaleSwitcher />
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface/50 transition-all hover:bg-surface-container-low active:scale-95"
        aria-label={intl.formatMessage({ id: 'layout.notifications' })}
      >
        <BellOutlined />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface/50 transition-all hover:bg-surface-container-low active:scale-95"
        aria-label={intl.formatMessage({ id: 'layout.settings' })}
        onClick={() => history.push(toPagePath('setting'))}
      >
        <SettingOutlined />
      </button>
      <Spin spinning={logoutLoading} size="small">
        <Dropdown
          menu={{ items: menuItems, onClick: handleMenuClick }}
          placement="bottomRight"
          trigger={['click']}
        >
          <button type="button" className="app-header-user">
            <Avatar size={32} className="app-header-user-avatar">
              {getInitial(displayUser.username, displayUser.email)}
            </Avatar>
            <span className="app-header-user-meta hidden xl:block">
              <span className="app-header-user-name">{displayUser.username}</span>
              <span className="app-header-user-email">{displayUser.email}</span>
            </span>
          </button>
        </Dropdown>
      </Spin>
    </div>
  );
};

export default HeaderActions;
