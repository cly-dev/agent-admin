import type { Integration } from '@/types/integration';
import { LinkOutlined, WarningOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Popconfirm } from 'antd';
import { useAuthModeLabel } from '@/hooks/useAuthModeOptions';
import {
  formatIntegrationHost,
  getAvatarVariant,
  getIntegrationInitials,
  isIntegrationDeleteDisabled,
  needsIntegrationReauth,
} from '../useIntegrations';
import styles from '../index.module.scss';

type IntegrationCardProps = {
  integration: Integration;
  onConfigure: (integration: Integration) => void;
  onDelete: (id: number) => void;
};

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onConfigure,
  onDelete,
}) => {
  const intl = useIntl();
  const authLabel = useAuthModeLabel(integration.authMode);
  const needsReauth = needsIntegrationReauth(integration);
  const toolCount = integration.toolCount ?? 0;
  const deleteDisabled = isIntegrationDeleteDisabled(integration);
  const deleteActionClass = needsReauth
    ? deleteDisabled
      ? styles.integrationCardActionDeleteWarningDisabled
      : styles.integrationCardActionDeleteWarning
    : deleteDisabled
      ? styles.integrationCardActionDeleteDisabled
      : styles.integrationCardActionDelete;
  const avatarVariant = getAvatarVariant(integration.name);
  const avatarToneClass = [
    styles.integrationCardAvatar0,
    styles.integrationCardAvatar1,
    styles.integrationCardAvatar2,
    styles.integrationCardAvatar3,
    styles.integrationCardAvatar4,
    styles.integrationCardAvatar5,
  ][avatarVariant];

  return (
    <article className={`${styles.integrationCard} ${needsReauth ? styles.integrationCardError : ''}`}>
      <div className={styles.integrationCardAccent} aria-hidden />

      <div className={styles.integrationCardInner}>
        <div className={styles.integrationCardHeader}>
          <div className={`${styles.integrationCardAvatar} ${avatarToneClass}`}>
            {getIntegrationInitials(integration.name)}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className={styles.integrationCardTitle} title={integration.name}>
            {integration.name}
          </h3>
          <p className={styles.integrationCardUrl} title={integration.baseUrl}>
            {integration.description}
          </p>
        </div>

        <div className={styles.integrationCardMeta}>
          <span className={styles.integrationCardChip}>{authLabel}</span>
          <span className={`${styles.integrationCardChip} ${styles.integrationCardChipHost}`}>
            <LinkOutlined className="mr-1 text-[10px] opacity-55" />
            {formatIntegrationHost(integration.baseUrl)}
          </span>
          <span className={styles.integrationCardChip}>
            {intl.formatMessage({ id: 'integration.card.tools' }, { count: toolCount })}
          </span>
        </div>

        {needsReauth ? (
          <div className={styles.integrationCardAlert}>
            <WarningOutlined className="text-xs" />
            {intl.formatMessage({ id: 'integration.card.credentialMissing' })}
          </div>
        ) : null}

        <div className={styles.integrationCardFooter}>
          <Popconfirm
            title={intl.formatMessage({ id: 'integration.card.deleteTitle' })}
            description={intl.formatMessage({ id: 'integration.card.deleteDesc' })}
            okText={intl.formatMessage({ id: 'common.delete' })}
            cancelText={intl.formatMessage({ id: 'common.cancel' })}
            okButtonProps={{ danger: true }}
            disabled={deleteDisabled}
            onConfirm={() => onDelete(integration.id)}
          >
            <button
              type="button"
              disabled={deleteDisabled}
              className={`${styles.integrationCardAction} ${deleteActionClass}`}
            >
              {intl.formatMessage({ id: 'common.delete' })}
            </button>
          </Popconfirm>
          <button
            type="button"
            className={`${styles.integrationCardAction} ${
              needsReauth ? styles.integrationCardActionReauth : styles.integrationCardActionConfigure
            }`}
            onClick={() => onConfigure(integration)}
          >
            {needsReauth
              ? intl.formatMessage({ id: 'common.reauth' })
              : intl.formatMessage({ id: 'common.configure' })}
          </button>
        </div>
      </div>
    </article>
  );
};

export default IntegrationCard;
