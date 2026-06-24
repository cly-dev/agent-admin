import { Link } from '@umijs/max';
import { Tooltip } from 'antd';
import type { ReactNode } from 'react';
import styles from './index.module.scss';

export const AppTableMuted: React.FC<{ children?: ReactNode }> = ({
  children = '—',
}) => <span className={styles.muted}>{children}</span>;

export const AppTableDescription: React.FC<{ children: ReactNode }> = ({
  children,
}) => <span className={styles.description}>{children}</span>;

type AppTablePrimaryCellProps = {
  title: ReactNode;
  meta?: ReactNode;
  href?: string;
  onLinkClick?: (event: React.MouseEvent) => void;
};

export const AppTablePrimaryCell: React.FC<AppTablePrimaryCellProps> = ({
  title,
  meta,
  href,
  onLinkClick,
}) => {
  const titleNode = href ? (
    <Link
      to={href}
      className={`${styles.link} ${styles.primaryTitle}`}
      onClick={onLinkClick}
    >
      {title}
    </Link>
  ) : (
    <span className={styles.primaryTitle}>{title}</span>
  );

  return (
    <div className={styles.primaryCell}>
      {titleNode}
      {meta ? <span className={styles.primaryMeta}>{meta}</span> : null}
    </div>
  );
};

type AppTableCodeCellProps = {
  value?: string;
  empty?: ReactNode;
};

export const AppTableCodeCell: React.FC<AppTableCodeCellProps> = ({
  value,
  empty,
}) => {
  if (!value) {
    return <AppTableMuted>{empty}</AppTableMuted>;
  }
  return (
    <Tooltip title={value}>
      <code className={styles.code}>{value}</code>
    </Tooltip>
  );
};

function methodClassName(method: string): string {
  const key = method.toUpperCase();
  if (key === 'GET') return styles.methodGet;
  if (key === 'POST') return styles.methodPost;
  if (key === 'PUT') return styles.methodPut;
  if (key === 'DELETE') return styles.methodDelete;
  return styles.methodDefault;
}

type AppTableMethodCellProps = {
  method?: string;
};

export const AppTableMethodCell: React.FC<AppTableMethodCellProps> = ({
  method,
}) => {
  if (!method) {
    return <AppTableMuted />;
  }
  return (
    <span className={`${styles.method} ${methodClassName(method)}`}>
      {method.toUpperCase()}
    </span>
  );
};

type AppTableStatusCellProps = {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
};

export const AppTableStatusCell: React.FC<AppTableStatusCellProps> = ({
  active,
  activeLabel,
  inactiveLabel,
}) => (
  <span
    className={`${styles.statusBadge} ${active ? styles.statusActive : styles.statusInactive}`}
  >
    <span className={styles.statusDot} aria-hidden />
    {active ? activeLabel : inactiveLabel}
  </span>
);

type AppTableBooleanStatusCellProps = {
  value?: boolean;
  activeLabel: string;
  inactiveLabel: string;
};

export const AppTableBooleanStatusCell: React.FC<
  AppTableBooleanStatusCellProps
> = ({ value, activeLabel, inactiveLabel }) => {
  if (value === undefined) {
    return <AppTableMuted />;
  }
  return (
    <AppTableStatusCell
      active={value !== false}
      activeLabel={activeLabel}
      inactiveLabel={inactiveLabel}
    />
  );
};

type AppTableActionsProps = {
  children: ReactNode;
  /** 表格列默认右对齐；抽屉工具栏等场景用 start */
  align?: 'start' | 'end';
};

export const AppTableActions: React.FC<AppTableActionsProps> = ({
  children,
  align = 'end',
}) => (
  <div
    className={`${styles.actions} ${align === 'start' ? styles.actionsStart : ''}`}
  >
    {children}
  </div>
);

type AppTableIconLinkProps = {
  href: string;
  title: string;
  children: ReactNode;
  onClick?: (event: React.MouseEvent) => void;
};

export const AppTableIconLink: React.FC<AppTableIconLinkProps> = ({
  href,
  title,
  children,
  onClick,
}) => (
  <Tooltip title={title}>
    <Link to={href} className={styles.iconBtn} onClick={onClick}>
      {children}
    </Link>
  </Tooltip>
);

export type AppTableButtonVariant = 'neutral' | 'edit' | 'primary' | 'danger';

type AppTableButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  /** @deprecated 请使用 variant="danger" */
  danger?: boolean;
  variant?: AppTableButtonVariant;
  onClick?: (event: React.MouseEvent) => void;
};

function resolveButtonClassName(
  variant: AppTableButtonVariant,
  danger?: boolean,
): string {
  const resolved = danger ? 'danger' : variant;
  switch (resolved) {
    case 'danger':
      return styles.dangerBtn;
    case 'primary':
      return styles.primaryBtn;
    case 'edit':
      return styles.editBtn;
    default:
      return styles.ghostBtn;
  }
}

export const AppTableButton: React.FC<AppTableButtonProps> = ({
  children,
  disabled,
  danger,
  variant = 'neutral',
  onClick,
}) => (
  <button
    type="button"
    className={resolveButtonClassName(variant, danger)}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </button>
);
