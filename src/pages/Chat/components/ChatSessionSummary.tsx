import type { Session } from '@/types/session';
import {
  CommentOutlined,
  MessageOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, useIntl } from '@umijs/max';
import styles from '../index.module.scss';

type ChatSessionSummaryProps = {
  session: Session;
  projectLabel: string;
  agentLabel: string;
  userLabel: string;
  turnCount: number;
  feedbackPath?: string;
};

export function ChatSessionSummary({
  session,
  projectLabel,
  agentLabel,
  userLabel,
  turnCount,
  feedbackPath,
}: ChatSessionSummaryProps) {
  const intl = useIntl();

  return (
    <section className={styles.chatDetailSummaryCard}>
      <div className={styles.chatDetailSummaryTop}>
        <div className={styles.chatDetailSummaryAvatar}>
          <CommentOutlined />
        </div>
        <div className={styles.chatDetailSummaryMain}>
          <p className={styles.chatDetailSummaryDesc}>
            {intl.formatMessage({ id: 'chat.detail.summaryDesc' })}
          </p>
        </div>
      </div>

      <div className={styles.chatDetailSummaryChips}>
        <span className={styles.chatDetailSummaryChip}>
          <MessageOutlined />
          {projectLabel}
        </span>
        <span className={styles.chatDetailSummaryChip}>
          <RobotOutlined />
          {agentLabel}
        </span>
        <span className={styles.chatDetailSummaryChip}>
          <UserOutlined />
          {userLabel}
        </span>
        {session.rated !== undefined ? (
          <span
            className={`${styles.chatDetailSummaryChip} ${
              session.rated
                ? styles.chatDetailSummaryChipSuccess
                : styles.chatDetailSummaryChipMuted
            }`}
          >
            {session.rated
              ? intl.formatMessage({ id: 'chat.rated' })
              : intl.formatMessage({ id: 'chat.unrated' })}
          </span>
        ) : null}
        {session.messageCount !== undefined ? (
          <span className={styles.chatDetailSummaryChip}>
            {intl.formatMessage(
              { id: 'chat.detail.messageCount' },
              { count: session.messageCount },
            )}
          </span>
        ) : null}
        <span className={styles.chatDetailSummaryChip}>
          {intl.formatMessage(
            { id: 'chat.detail.turnCount' },
            { count: turnCount },
          )}
        </span>
      </div>

      <dl className={styles.chatDetailSummaryMeta}>
        <div>
          <dt>{intl.formatMessage({ id: 'chat.detail.sessionId' })}</dt>
          <dd>{session.id}</dd>
        </div>
        {session.updatedAt ? (
          <div>
            <dt>{intl.formatMessage({ id: 'chat.detail.updatedAt' })}</dt>
            <dd>{session.updatedAt}</dd>
          </div>
        ) : null}
      </dl>

      {feedbackPath ? (
        <div className={styles.chatDetailSummaryActions}>
          <Link
            to={feedbackPath}
            className={styles.chatDetailSummaryFeedbackLink}
          >
            {intl.formatMessage({
              id: 'messageFeedback.detail.viewSessionFeedback',
            })}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
