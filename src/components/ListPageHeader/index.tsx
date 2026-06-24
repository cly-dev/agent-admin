import type { ReactNode } from 'react';
import styles from './index.module.scss';

export type ListPageHeaderProps = {
  title: ReactNode;
  /** 主说明文案 */
  description?: ReactNode;
  /** 次要信息（如列表统计），显示在说明下方 */
  meta?: ReactNode;
  /** 右侧操作区（新建按钮等） */
  actions?: ReactNode;
  className?: string;
};

const ListPageHeader: React.FC<ListPageHeaderProps> = ({
  title,
  description,
  meta,
  actions,
  className,
}) => {
  return (
    <header className={[styles.header, className].filter(Boolean).join(' ')}>
      <div className={styles.main}>
        <h1 className={styles.title}>{title}</h1>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
        {meta ? <p className={styles.meta}>{meta}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
};

export default ListPageHeader;
