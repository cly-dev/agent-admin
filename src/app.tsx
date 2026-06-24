import { AppTopBar } from '@/components/AppLayout';
import AppLogo from '@/components/AppLogo';
import OmnixChatWidget from '@/components/OmnixChatWidget';
import { getAuthSnapshot } from '@/services/auth/user';
import type { AuthUser } from '@/types/admin-user';
import { isAppPage } from '@/utils/project-path';
import { requestConfig } from '@/utils/request';
import {
  history,
  type RequestConfig,
  type RunTimeLayoutConfig,
} from '@umijs/max';
import './global.css';

export async function getInitialState(): Promise<{
  name: string;
  user: AuthUser | null;
  isAuthenticated: boolean;
  accessToken: string | null;
}> {
  const snapshot = getAuthSnapshot();
  return {
    name: snapshot.user?.username ?? '',
    user: snapshot.user,
    isAuthenticated: snapshot.isAuthenticated,
    accessToken: snapshot.accessToken,
  };
}

export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    title: false,
    logo: false,
    layout: 'side',
    contentWidth: 'Fluid',
    fixedHeader: false,
    fixSiderbar: true,
    footerRender: false,
    headerRender: false,
    rightContentRender: false,
    pageTitleRender: false,
    breadcrumbRender: false,
    menu: {
      locale: true,
      defaultOpenAll: false,
    },
    siderWidth: 256,
    token: {
      bgLayout: '#e8eff9',
      header: {
        colorBgHeader: 'rgba(255, 255, 255, 0.85)',
        heightLayoutHeader: 56,
      },
      sider: {
        colorMenuBackground: 'transparent',
        colorTextMenu: '#3d4554',
        colorTextMenuSelected: '#003d8f',
        colorBgMenuItemSelected: 'rgba(0, 61, 143, 0.08)',
        colorTextMenuItemHover: '#003d8f',
      },
      pageContainer: {
        paddingBlockPageContainerContent: 0,
        paddingInlinePageContainerContent: 0,
        colorBgPageContainer: 'transparent',
      },
    },
    menuHeaderRender: (_logo, _title, props) => (
      <AppLogo collapsed={props?.collapsed} />
    ),
    menuFooterRender: false,
    childrenRender: (children, props) => (
      <div className="app-layout-shell flex min-h-screen flex-col">
        <AppTopBar
          isMobile={props.isMobile}
          collapsed={props.collapsed}
          onCollapse={props.onCollapse}
        />
        <div className="app-layout-body min-h-0 flex-1">{children}</div>
        <OmnixChatWidget />
      </div>
    ),
    onPageChange: () => {
      const { location } = history;
      const authSnapshot = getAuthSnapshot();
      const loggedIn = authSnapshot.isAuthenticated;
      const isLoginPage = location.pathname === '/login';

      if (!loggedIn && !isLoginPage) {
        history.push('/login');
        return;
      }

      if (loggedIn && isLoginPage) {
        history.replace('/dashboard');
        return;
      }

      if (loggedIn && !isLoginPage && !isAppPage(location.pathname)) {
        history.replace('/dashboard');
        return;
      }

      const userChanged = initialState?.user?.id !== authSnapshot.user?.id;
      const authChanged = initialState?.isAuthenticated !== loggedIn;

      if (authChanged || userChanged) {
        void setInitialState((state) => ({
          name: authSnapshot.user?.username ?? state?.name ?? '',
          user: authSnapshot.user,
          isAuthenticated: loggedIn,
          accessToken: authSnapshot.accessToken,
        }));
      }
    },
  };
};

export const request: RequestConfig = requestConfig;
