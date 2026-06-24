import type { MessageFeedbackListItem } from '@/types/message-feedback';
import { Link, useIntl } from '@umijs/max';
import { Descriptions, Drawer, Spin, Tag } from 'antd';
import styles from '../../index.module.scss';

type MessageFeedbackDetailDrawerProps = {
  open: boolean;
  loading?: boolean;
  detail: MessageFeedbackListItem | null;
  sessionDetailPath: (sessionId: string) => string;
  onClose: () => void;
};

function formatUser(detail: MessageFeedbackListItem): string {
  const parts = [
    detail.user.username,
    detail.user.employeeId,
    detail.user.email,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : `#${detail.user.id}`;
}

const MessageFeedbackDetailDrawer: React.FC<
  MessageFeedbackDetailDrawerProps
> = ({ open, loading = false, detail, sessionDetailPath, onClose }) => {
  const intl = useIntl();

  return (
    <Drawer
      className={styles.feedbackDetailDrawer}
      title={intl.formatMessage({ id: 'messageFeedback.detail.title' })}
      width={640}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {detail ? (
          <div className={styles.feedbackDetailBody}>
            <div className={styles.feedbackDetailRatingRow}>
              <Tag
                className={
                  detail.rating === 'up'
                    ? styles.feedbackRatingTagUp
                    : styles.feedbackRatingTagDown
                }
              >
                {detail.rating === 'up'
                  ? intl.formatMessage({ id: 'messageFeedback.rating.up' })
                  : intl.formatMessage({ id: 'messageFeedback.rating.down' })}
              </Tag>
              <span className={styles.feedbackDetailTime}>
                {detail.createdAt}
              </span>
            </div>

            <Descriptions
              column={1}
              size="small"
              bordered
              className={styles.feedbackDetailDescriptions}
            >
              <Descriptions.Item
                label={intl.formatMessage({ id: 'messageFeedback.detail.id' })}
              >
                #{detail.id}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({
                  id: 'messageFeedback.column.user',
                })}
              >
                {formatUser(detail)}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({
                  id: 'messageFeedback.column.agent',
                })}
              >
                {detail.agentName?.trim() ||
                  (detail.agentId ? `#${detail.agentId}` : '—')}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({
                  id: 'messageFeedback.column.session',
                })}
              >
                {detail.sessionId ? (
                  <Link to={sessionDetailPath(detail.sessionId)}>
                    {detail.session.title?.trim() || detail.sessionId}
                  </Link>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({
                  id: 'messageFeedback.column.turn',
                })}
              >
                {detail.turnId ? `#${detail.turnId}` : '—'}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({
                  id: 'messageFeedback.column.message',
                })}
              >
                #{detail.messageId}
              </Descriptions.Item>
            </Descriptions>

            {detail.rating === 'down' ? (
              <section className={styles.feedbackDetailBlock}>
                <h4 className={styles.feedbackDetailBlockTitle}>
                  {intl.formatMessage({
                    id: 'messageFeedback.detail.reasonSection',
                  })}
                </h4>
                {detail.reasonTagLabels.length > 0 ? (
                  <div className={styles.feedbackDetailTags}>
                    {detail.reasonTagLabels.map((label) => (
                      <Tag key={label}>{label}</Tag>
                    ))}
                  </div>
                ) : (
                  <p className={styles.feedbackDetailEmpty}>
                    {intl.formatMessage({
                      id: 'messageFeedback.detail.noReason',
                    })}
                  </p>
                )}
                {detail.comment?.trim() ? (
                  <p className={styles.feedbackDetailComment}>
                    {detail.comment}
                  </p>
                ) : null}
              </section>
            ) : null}

            <section className={styles.feedbackDetailBlock}>
              <h4 className={styles.feedbackDetailBlockTitle}>
                {intl.formatMessage({
                  id: 'messageFeedback.detail.messageSection',
                })}
              </h4>
              <p className={styles.feedbackDetailMessageMeta}>
                {intl.formatMessage(
                  { id: 'messageFeedback.detail.messageMeta' },
                  {
                    id: detail.message.id,
                    time: detail.message.createdAt || '—',
                  },
                )}
              </p>
              <pre className={styles.feedbackDetailMessagePreview}>
                {detail.message.contentPreview?.trim() ||
                  intl.formatMessage({
                    id: 'messageFeedback.detail.noMessagePreview',
                  })}
              </pre>
            </section>
          </div>
        ) : (
          !loading && (
            <p className={styles.feedbackDetailEmpty}>
              {intl.formatMessage({ id: 'messageFeedback.detail.notFound' })}
            </p>
          )
        )}
      </Spin>
    </Drawer>
  );
};

export default MessageFeedbackDetailDrawer;
