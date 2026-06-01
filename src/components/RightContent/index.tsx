import { getAuthSnapshot, signOut } from '@/services/auth/user';
import { BellOutlined, LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Avatar, Dropdown, Spin } from 'antd';
import type { MenuProps } from 'antd';
import { useMemo, useState } from 'react';

const getInitial = (name?: string, email?: string): string => {
  const source = name?.trim() || email?.trim() || 'U';
  return source.charAt(0).toUpperCase();
};

const RightContent: React.FC = () => {
  const { user, clearLoginSession } = useModel('global');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const displayUser = user ?? getAuthSnapshot().user;

  const menuItems = useMemo<MenuProps['items']>(
    () => [
      {
        key: 'profile',
        label: (
          <div className="py-1">
            <p className="text-sm font-medium text-on-surface">{displayUser?.username ?? '未登录'}</p>
            <p className="text-xs text-on-surface/60">{displayUser?.email ?? '-'}</p>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: '设置',
        onClick: () => history.push('/setting'),
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
      },
    ],
    [displayUser?.email, displayUser?.username],
  );

  const handleMenuClick: MenuProps['onClick'] = async ({ key }) => {
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
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface/50 transition-all hover:bg-surface-container-low active:scale-95"
        aria-label="Notifications"
      >
        <BellOutlined />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface/50 transition-all hover:bg-surface-container-low active:scale-95"
        aria-label="Settings"
        onClick={() => history.push('/setting')}
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
            <UserOutlined className="text-xs text-on-surface/50 xl:hidden" />
          </button>
        </Dropdown>
      </Spin>
      <button
        type="button"
        className="app-button-primary hidden px-5 py-2 text-[13px] font-bold shadow-md shadow-primary/20 transition-transform active:scale-95 sm:inline-flex"
      >
        DEPLOY
      </button>
    </div>
  );
};

export default RightContent;
