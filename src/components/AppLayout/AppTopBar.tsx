import { MenuOutlined, RightOutlined } from '@ant-design/icons';
import HeaderActions from '@/components/HeaderActions';
import { getCurrentPagePath } from '@/utils/project-path';
import { useIntl, useLocation } from '@umijs/max';

type AppTopBarProps = {
  isMobile?: boolean;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
};

const AppTopBar: React.FC<AppTopBarProps> = ({ isMobile, collapsed, onCollapse }) => {
  const intl = useIntl();
  const { pathname } = useLocation();
  const currentRoute = getCurrentPagePath(pathname);
  const routeSegments = currentRoute.split('/').filter(Boolean);

  const displaySegments = routeSegments.map((segment) => {
    if (/^\d+$/.test(segment) || segment.length >= 20) {
      return ':id';
    }
    return segment;
  });

  return (
    <header className="app-top-bar">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {isMobile ? (
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[--radius-ui] text-on-surface/60 hover:bg-surface-container-low"
            aria-label={intl.formatMessage({ id: 'layout.toggleMenu' })}
            onClick={() => onCollapse?.(!collapsed)}
          >
            <MenuOutlined />
          </button>
        ) : null}

        <div className="min-w-0 rounded-[--radius-ui] bg-surface-container-low/70 px-2.5 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-on-surface/38">
              Route
            </span>
            <div className="flex min-w-0 items-center gap-1.5">
              {displaySegments.length === 0 ? (
                <span className="text-xs font-medium text-on-surface/55">/</span>
              ) : (
                displaySegments.map((segment, index) => (
                  <div key={`${segment}-${index}`} className="flex min-w-0 items-center gap-1.5">
                    {index > 0 ? (
                      <RightOutlined className="shrink-0 text-[10px] text-on-surface/30" />
                    ) : null}
                    <span className="truncate rounded-md bg-surface-container-low px-1.5 py-0.5 text-xs font-medium text-on-surface/62">
                      {segment}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <HeaderActions />
    </header>
  );
};

export default AppTopBar;
