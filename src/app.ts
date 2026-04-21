import './global.css';
import { history, type RunTimeLayoutConfig } from '@umijs/max';
import { isAuthenticated } from '@/services/auth/session';

// 运行时配置

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState(): Promise<{
  name: string;
  isAuthenticated: boolean;
}> {
  return { name: '@umijs/max', isAuthenticated: isAuthenticated() };
}

export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
    menu: {
      locale: false,
    },
    onPageChange: () => {
      const { location } = history;
      const loggedIn = isAuthenticated();
      const isLoginPage = location.pathname === '/login';

      if (!loggedIn && !isLoginPage) {
        history.push('/login');
        return;
      }

      if (loggedIn && isLoginPage) {
        history.push('/home');
      }

      if (initialState?.isAuthenticated !== loggedIn) {
        void setInitialState((state) => ({
          name: state?.name ?? '@umijs/max',
          isAuthenticated: loggedIn,
        }));
      }
    },
  };
};
