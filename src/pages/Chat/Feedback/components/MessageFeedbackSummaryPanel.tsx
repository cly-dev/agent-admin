import type { MessageFeedbackSummary } from '@/types/message-feedback';
import { useIntl } from '@umijs/max';
import { Select, Spin } from 'antd';
import styles from '../../index.module.scss';

type MessageFeedbackSummaryPanelProps = {
  summary: MessageFeedbackSummary | null;
  loading?: boolean;
  days: number;
  dayOptions: readonly number[];
  onDaysChange: (days: number) => void;
};

function formatRate(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0%';
  }
  return `${(value * 100).toFixed(1)}%`;
}

function formatWindowLabel(from: string, to: string): string {
  if (!from || !to) {
    return '—';
  }
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return '—';
  }
  const fmt = (date: Date) =>
    date.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' });
  return `${fmt(fromDate)} – ${fmt(toDate)}`;
}

const MessageFeedbackSummaryPanel: React.FC<
  MessageFeedbackSummaryPanelProps
> = ({ summary, loading = false, days, dayOptions, onDaysChange }) => {
  const intl = useIntl();

  const maxReasonCount = Math.max(
    ...(summary?.downReasonTagCounts.map((item) => item.count) ?? [0]),
    1,
  );

  return (
    <section className={styles.feedbackSummarySection}>
      <header className={styles.feedbackSummaryHeader}>
        <div>
          <h2 className={styles.feedbackSummaryTitle}>
            {intl.formatMessage({ id: 'messageFeedback.summary.title' })}
          </h2>
          <p className={styles.feedbackSummaryDesc}>
            {summary
              ? intl.formatMessage(
                  { id: 'messageFeedback.summary.window' },
                  { range: formatWindowLabel(summary.from, summary.to) },
                )
              : intl.formatMessage({ id: 'messageFeedback.summary.emptyHint' })}
          </p>
        </div>
        <Select
          className={`app-input ${styles.feedbackSummaryDaysSelect}`}
          value={days}
          options={dayOptions.map((value) => ({
            value,
            label: intl.formatMessage(
              { id: 'messageFeedback.summary.days' },
              { days: value },
            ),
          }))}
          onChange={onDaysChange}
        />
      </header>

      <Spin spinning={loading}>
        <div className={styles.feedbackSummaryGrid}>
          <div className={styles.feedbackSummaryCard}>
            <span className={styles.feedbackSummaryCardLabel}>
              {intl.formatMessage({ id: 'messageFeedback.summary.total' })}
            </span>
            <strong className={styles.feedbackSummaryCardValue}>
              {summary?.totals.feedback ?? 0}
            </strong>
          </div>
          <div className={styles.feedbackSummaryCard}>
            <span className={styles.feedbackSummaryCardLabel}>
              {intl.formatMessage({ id: 'messageFeedback.summary.up' })}
            </span>
            <strong
              className={`${styles.feedbackSummaryCardValue} ${styles.feedbackSummaryUp}`}
            >
              {summary?.totals.up ?? 0}
            </strong>
          </div>
          <div className={styles.feedbackSummaryCard}>
            <span className={styles.feedbackSummaryCardLabel}>
              {intl.formatMessage({ id: 'messageFeedback.summary.down' })}
            </span>
            <strong
              className={`${styles.feedbackSummaryCardValue} ${styles.feedbackSummaryDown}`}
            >
              {summary?.totals.down ?? 0}
            </strong>
          </div>
          <div className={styles.feedbackSummaryCard}>
            <span className={styles.feedbackSummaryCardLabel}>
              {intl.formatMessage({ id: 'messageFeedback.summary.upRate' })}
            </span>
            <strong className={styles.feedbackSummaryCardValue}>
              {formatRate(summary?.totals.upRate ?? 0)}
            </strong>
          </div>
        </div>

        <div className={styles.feedbackSummaryPanels}>
          <div className={styles.feedbackSummaryPanel}>
            <h3 className={styles.feedbackSummaryPanelTitle}>
              {intl.formatMessage({
                id: 'messageFeedback.summary.reasonDistribution',
              })}
            </h3>
            {summary && summary.downReasonTagCounts.length > 0 ? (
              <ul className={styles.feedbackReasonList}>
                {summary.downReasonTagCounts.map((item) => (
                  <li key={item.key} className={styles.feedbackReasonItem}>
                    <div className={styles.feedbackReasonMeta}>
                      <span className={styles.feedbackReasonLabel}>
                        {item.label}
                      </span>
                      <span className={styles.feedbackReasonCount}>
                        {item.count}
                      </span>
                    </div>
                    <div className={styles.feedbackReasonBarTrack}>
                      <span
                        className={styles.feedbackReasonBarFill}
                        style={{
                          width: `${(item.count / maxReasonCount) * 100}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.feedbackSummaryEmpty}>
                {intl.formatMessage({
                  id: 'messageFeedback.summary.noReasonData',
                })}
              </p>
            )}
          </div>

          <div className={styles.feedbackSummaryPanel}>
            <h3 className={styles.feedbackSummaryPanelTitle}>
              {intl.formatMessage({
                id: 'messageFeedback.summary.downByAgent',
              })}
            </h3>
            {summary && summary.downByAgent.length > 0 ? (
              <ul className={styles.feedbackAgentList}>
                {summary.downByAgent.map((item) => (
                  <li key={item.agentId} className={styles.feedbackAgentItem}>
                    <span className={styles.feedbackAgentName}>
                      {item.agentName}
                    </span>
                    <span className={styles.feedbackAgentCount}>
                      {item.downCount}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.feedbackSummaryEmpty}>
                {intl.formatMessage({
                  id: 'messageFeedback.summary.noAgentData',
                })}
              </p>
            )}
          </div>
        </div>
      </Spin>
    </section>
  );
};

export default MessageFeedbackSummaryPanel;
