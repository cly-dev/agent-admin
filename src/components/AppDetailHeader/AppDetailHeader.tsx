import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import type { ReactNode } from 'react';
import styles from './index.module.scss';

export type AppDetailBackButtonProps = {
  onClick: () => void;
  label?: ReactNode;
  className?: string;
};

/** 详情页统一返回按钮 */
export const AppDetailBackButton: React.FC<AppDetailBackButtonProps> = ({
  onClick,
  label,
  className,
}) => {
  const intl = useIntl();
  const resolvedLabel =
    label ?? intl.formatMessage({ id: 'common.backToList' });

  return (
    <button
      type="button"
      className={`${styles.backBtn} ${className ?? ''}`.trim()}
      onClick={onClick}
    >
      <ArrowLeftOutlined />
      {resolvedLabel}
    </button>
  );
};

export type AppDetailHeaderProps = {
  onBack: () => void;
  backLabel?: ReactNode;
  /** 传入时右侧显示保存按钮 */
  onSave?: () => void;
  saveLabel?: ReactNode;
  saveDisabled?: boolean;
  saveLoading?: boolean;
  extraActions?: ReactNode;
  bordered?: boolean;
  className?: string;
};

export const AppDetailHeader: React.FC<AppDetailHeaderProps> = ({
  onBack,
  backLabel,
  onSave,
  saveLabel,
  saveDisabled = false,
  saveLoading = false,
  extraActions,
  bordered = false,
  className,
}) => {
  const intl = useIntl();
  const resolvedSaveLabel =
    saveLabel ?? intl.formatMessage({ id: 'common.save' });

  return (
    <header
      className={`${styles.topBar} ${bordered ? styles.topBarBordered : ''} ${className ?? ''}`.trim()}
    >
      <AppDetailBackButton onClick={onBack} label={backLabel} />
      {onSave || extraActions ? (
        <div className={styles.actions}>
          {extraActions}
          {onSave ? (
            <button
              type="button"
              className="app-button-primary inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saveDisabled || saveLoading}
              onClick={onSave}
            >
              <SaveOutlined />
              {resolvedSaveLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
};

type AppDetailHeadingProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
};

export const AppDetailHeading: React.FC<AppDetailHeadingProps> = ({
  title,
  subtitle,
  className,
}) => {
  if (!title && !subtitle) {
    return null;
  }

  return (
    <div className={`${styles.heading} ${className ?? ''}`.trim()}>
      {title ? <h1 className={styles.title}>{title}</h1> : null}
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </div>
  );
};
