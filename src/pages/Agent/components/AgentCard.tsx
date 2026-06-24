import {
  DeleteOutlined,
  RobotOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Popconfirm } from 'antd';
import type { AgentListItem } from '../agentShared';
import { getAgentListStatus } from '../agentShared';
import styles from '../index.module.scss';

type AgentCardProps = {
  agent: AgentListItem;
  onConfigure: (agent: AgentListItem) => void;
  onDelete: (id: number) => void;
};

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onConfigure,
  onDelete,
}) => {
  const intl = useIntl();
  const status = getAgentListStatus(agent);
  const isInactive = status === 'inactive';

  const statusLabelId =
    status === 'active' ? 'agent.status.active' : 'agent.status.inactive';

  return (
    <article
      className={[styles.agentCard, isInactive ? styles.agentCardInactive : '']
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className={styles.agentCardClickLayer}
        onClick={() => onConfigure(agent)}
        aria-label={intl.formatMessage({ id: 'common.configure' })}
      />

      <div className={styles.agentCardInner}>
        <div className={styles.agentCardHeader}>
          <div className={styles.agentCardIdentity}>
            <div className={styles.agentCardAvatar}>
              <RobotOutlined className="text-lg" />
            </div>
            <div className={styles.agentCardHeading}>
              <h3 className={styles.agentCardTitle} title={agent.name}>
                {agent.name}
              </h3>
              <div className={styles.agentCardMeta}>
                <span className={styles.agentCardStatus}>
                  <span
                    className={`${styles.agentCardStatusDot} ${
                      isInactive ? styles.agentCardStatusDotMuted : ''
                    }`}
                  />
                  {intl.formatMessage({ id: statusLabelId })}
                </span>
                <span className={styles.agentCardBadge}>
                  {agent.maxStepsLabel}
                </span>
                {typeof agent.hostToolCount === 'number' &&
                agent.hostToolCount > 0 ? (
                  <span className={styles.agentCardBadge}>
                    {intl.formatMessage(
                      { id: 'agent.card.hostToolCount' },
                      { count: agent.hostToolCount },
                    )}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className={styles.agentCardActionsTop}>
            <Popconfirm
              title={intl.formatMessage({ id: 'agent.card.deleteTitle' })}
              description={intl.formatMessage({ id: 'agent.card.deleteDesc' })}
              okText={intl.formatMessage({ id: 'common.delete' })}
              cancelText={intl.formatMessage({ id: 'common.cancel' })}
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(agent.id)}
            >
              <button
                type="button"
                className={`${styles.agentCardIconAction} ${styles.agentCardIconActionDanger}`}
                aria-label={intl.formatMessage({ id: 'common.delete' })}
                onClick={(event) => event.stopPropagation()}
              >
                <DeleteOutlined />
              </button>
            </Popconfirm>
          </div>
        </div>

        <p className={styles.agentCardDescription}>
          {agent.description ||
            intl.formatMessage({ id: 'agent.noDescription' })}
        </p>

        <p className={styles.agentCardMetaLine}>{agent.updatedAtLabel}</p>

        <div className={styles.agentCardFooter}>
          <button
            type="button"
            className={styles.agentCardActionConfigure}
            onClick={(event) => {
              event.stopPropagation();
              onConfigure(agent);
            }}
          >
            <SettingOutlined />
            {intl.formatMessage({ id: 'common.configure' })}
          </button>
        </div>
      </div>
    </article>
  );
};

export default AgentCard;
