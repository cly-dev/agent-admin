import ListScopeBar from '@/components/ListScopeBar';
import type { ReactNode } from 'react';
import styles from './index.module.scss';

export type AppListQueryToolbarProps = {
  /** 左侧展示当前项目切换（项目上下文列表页） */
  showProjectScope?: boolean;
  children: ReactNode;
  className?: string;
};

/** 列表页主行：项目切换 + 搜索框（与 AppQueryPanel list 布局一致） */
const AppListQueryToolbar: React.FC<AppListQueryToolbarProps> = ({
  showProjectScope = false,
  children,
  className,
}) => {
  return (
    <div className={`${styles.listToolbar} ${className ?? ''}`.trim()}>
      <div className={styles.main}>
        {showProjectScope ? (
          <div className={styles.leading}>
            <ListScopeBar compact />
          </div>
        ) : null}
        <div className={styles.querySide}>{children}</div>
      </div>
    </div>
  );
};

export default AppListQueryToolbar;
