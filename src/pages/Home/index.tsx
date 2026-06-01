import { trim } from '@/utils/format';
import { PageContainer } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { signOut } from '@/services/auth/user';
import { useState } from 'react';

const HomePage: React.FC = () => {
  const { name, clearLoginSession } = useModel('global');
  const [logoutLoading, setLogoutLoading] = useState<boolean>(false);

  const handleLogout = async (): Promise<void> => {
    setLogoutLoading(true);
    try {
      await signOut();
      clearLoginSession();
      history.push('/login');
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <PageContainer
      ghost
      header={{
        title: (
          <div className="app-frosted-header rounded-[--radius-ui] px-4 py-3">
            <span className="text-sm font-semibold tracking-[-0.01em] text-on-surface">
              The Cognitive Architect Workspace
            </span>
            <button
              type="button"
              className="ml-3 app-button-tertiary px-3 py-1 text-xs font-medium"
              onClick={() => {
                void handleLogout();
              }}
              disabled={logoutLoading}
            >
              {logoutLoading ? '退出中...' : '退出登录'}
            </button>
          </div>
        ),
      }}
    >
      <div className="app-panel p-6">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <section className="app-card space-y-4 p-6">
            <header>
              <p className="text-[0.75rem] font-medium tracking-[0.02em] text-primary">
                ACTIVE WORKBENCH
              </p>
              <h1 className="text-[1.5rem] font-semibold tracking-[-0.01em] text-on-surface">
                欢迎使用 {trim(name)}
              </h1>
              <p className="text-sm text-on-surface/70">
                所有 UI 已基于全局主题令牌落地，后续页面可直接复用。
              </p>
            </header>

            <div className="space-y-2">
              <label className="text-xs font-medium tracking-[0.02em] text-on-surface/80">
                Agent Name
              </label>
              <input
                className="app-input w-full px-3 py-2 text-sm"
                defaultValue={trim(name)}
                placeholder="Type an agent identity"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="app-button-primary px-4 py-2 text-sm font-medium"
              >
                Primary Action
              </button>
              <button
                type="button"
                className="app-button-secondary px-4 py-2 text-sm font-medium"
              >
                Secondary
              </button>
              <button
                type="button"
                className="app-button-tertiary px-4 py-2 text-sm font-medium"
              >
                Tertiary
              </button>
            </div>
          </section>

          <aside className="app-floating space-y-3 p-4">
            <h2 className="text-sm font-semibold text-on-surface">Utility Rail</h2>
            <ul className="space-y-2">
              <li className="app-card px-3 py-2 text-xs text-on-surface/80">
                No 1px divider lines
              </li>
              <li className="app-card px-3 py-2 text-xs text-on-surface/80">
                Surface tier based separation
              </li>
              <li className="app-card px-3 py-2 text-xs text-on-surface/80">
                Rounded 6px interactive elements
              </li>
            </ul>
          </aside>
        </div>

        <section className="mt-4 app-editor-surface p-4">
          <p className="text-xs text-secondary-container">function orchestrate(agent) {'{'}</p>
          <p className="pl-4 text-xs text-tertiary-fixed-dim">
            {'return "Theme-governed UI ready";'}
          </p>
          <p className="text-xs text-secondary-container">{'}'}</p>
        </section>
      </div>
    </PageContainer>
  );
};

export default HomePage;
