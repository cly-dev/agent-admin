import { useProjectRoute } from '@/hooks/useProjectRoute';
import { getPageKeyFromPath, type AppPageKey } from '@/utils/project-path';
import { DownOutlined } from '@ant-design/icons';
import { useIntl, useLocation } from '@umijs/max';
import type { MenuProps } from 'antd';
import { Dropdown, Spin } from 'antd';
import { useMemo } from 'react';

const PAGE_MENU_IDS: Record<AppPageKey, string> = {
  dashboard: 'menu.dashboard',
  project: 'menu.project',
  agent: 'menu.agent',
  tool: 'menu.tool',
  flow: 'menu.flow',
  workflow: 'menu.workflow',
  audit: 'menu.audit',
  chat: 'menu.chat',
  user: 'menu.user',
  setting: 'menu.setting',
};

type ProjectSwitcherProps = {
  showPageLabel?: boolean;
};

const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  showPageLabel = true,
}) => {
  const intl = useIntl();
  const { pathname } = useLocation();
  const { currentProject, projects, loading, switchProject } =
    useProjectRoute();

  const pageKey = getPageKeyFromPath(pathname);
  const pageMenuId = PAGE_MENU_IDS[pageKey];
  const currentPageLabel = pageMenuId
    ? intl.formatMessage({ id: pageMenuId })
    : '';

  const menuItems = useMemo<MenuProps['items']>(() => {
    if (projects.length === 0) {
      return [
        {
          key: 'empty',
          disabled: true,
          label: (
            <span className="text-sm text-on-surface/50">
              {loading
                ? intl.formatMessage({ id: 'project.loading' })
                : intl.formatMessage({ id: 'project.empty' })}
            </span>
          ),
        },
      ];
    }

    return projects.map((project) => ({
      key: String(project.id),
      label: (
        <div className="flex min-w-[220px] items-center justify-between gap-3 py-0.5">
          <span className="truncate text-sm font-medium text-on-surface">
            {project.name}
          </span>
          {project.isActive ? (
            <span className="app-status-active shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
              {intl.formatMessage({ id: 'status.active' })}
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase text-on-surface/50">
              {intl.formatMessage({ id: 'status.inactive' })}
            </span>
          )}
        </div>
      ),
    }));
  }, [intl, loading, projects]);

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    switchProject(Number(key));
  };

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Dropdown
        menu={{ items: menuItems, onClick: handleMenuClick }}
        trigger={['click']}
        placement="bottomLeft"
      >
        <button
          type="button"
          className={`flex max-w-full items-center gap-2 text-left transition-colors ${
            showPageLabel
              ? 'rounded-[--radius-ui] px-2 py-1.5 hover:bg-surface-container-low'
              : 'rounded-md border border-surface-container-high bg-surface px-2.5 py-1.5 shadow-sm hover:border-primary/30 hover:bg-surface-container-low'
          }`}
        >
          {showPageLabel ? (
            <>
              <span className="hidden truncate text-sm text-on-surface/60 sm:inline">
                {currentPageLabel}
              </span>
              <span className="hidden text-on-surface/30 sm:inline">/</span>
            </>
          ) : null}
          <Spin spinning={loading && !currentProject} size="small">
            <span
              className={`truncate text-sm font-semibold ${
                showPageLabel ? 'text-on-surface' : 'text-on-surface/88'
              }`}
            >
              {currentProject?.name ??
                intl.formatMessage({ id: 'project.select' })}
            </span>
          </Spin>
          <DownOutlined
            className={`shrink-0 text-[10px] ${
              showPageLabel ? 'text-on-surface/40' : 'text-on-surface/55'
            }`}
          />
        </button>
      </Dropdown>

      {showPageLabel && currentProject?.isActive ? (
        <span className="app-status-active hidden shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:inline-flex">
          {intl.formatMessage({ id: 'status.active' })}
        </span>
      ) : null}
    </div>
  );
};

export default ProjectSwitcher;
