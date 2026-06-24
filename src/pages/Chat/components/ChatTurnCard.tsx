import type { AgentRunStatus } from '@/types/agent-run';
import type { MessageTurn } from '@/types/message-turn';
import {
  RobotOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Rate } from 'antd';
import { useMemo } from 'react';
import {
  agentRunStatusColor,
  buildTurnConversationMetadata,
  formatDateTime,
  formatMessageContent,
  formatMs,
} from '../chatTurnDisplay';
import styles from '../index.module.scss';
import { ChatAgentRunPanel } from './ChatAgentRunPanel';
import { ChatJsonViewer } from './ChatJsonViewer';
import { ChatTurnStatsPanel } from './ChatTurnStatsPanel';

type ChatTurnCardProps = {
  turn: MessageTurn;
  onViewAgentRun: (runId: number) => void;
  onRate?: (turnId: number, rating: number) => void;
};

function TurnStatusBadge({ status }: { status?: AgentRunStatus | string }) {
  if (!status) {
    return null;
  }
  const tone =
    status === 'running' || status === 'success' || status === 'failed'
      ? agentRunStatusColor[status]
      : 'default';
  return (
    <span
      className={`${styles.chatDetailStatusBadge} ${styles[`chatDetailStatus_${tone}`]}`}
    >
      {status}
    </span>
  );
}

export function ChatTurnCard({
  turn,
  onViewAgentRun,
  onRate,
}: ChatTurnCardProps) {
  const intl = useIntl();
  const userContent = formatMessageContent(
    turn.userInput?.trim() || turn.message?.content?.trim(),
  );
  const assistantContent = formatMessageContent(
    turn.finalOutput?.trim() || turn.outputMessage?.content?.trim(),
  );
  const agentName = turn.primaryAgent?.name;
  const agentRuns = turn.agentRuns ?? [];
  const conversationMetadata = useMemo(
    () => buildTurnConversationMetadata(turn),
    [turn],
  );

  return (
    <article className={styles.chatDetailTurnCard}>
      <header className={styles.chatDetailTurnHeader}>
        <div className={styles.chatDetailTurnHeaderMain}>
          <h3 className={styles.chatDetailTurnTitle}>
            <span className={styles.chatDetailTurnIndex}>{turn.id}</span>
            {intl.formatMessage(
              { id: 'chat.detail.turnTitle' },
              { id: turn.id },
            )}
          </h3>
          <div className={styles.chatDetailTurnMetaRow}>
            <TurnStatusBadge status={turn.status} />
            {turn.finishReason ? (
              <span className={styles.chatDetailFinishReason}>
                {turn.finishReason}
              </span>
            ) : null}
            {turn.durationMs !== undefined ? (
              <span className={styles.chatDetailDurationChip}>
                <ThunderboltOutlined />
                {formatMs(turn.durationMs)}
              </span>
            ) : null}
          </div>
        </div>
        {onRate ? (
          <div className={styles.chatDetailTurnRating}>
            <span>{intl.formatMessage({ id: 'chat.detail.rating' })}</span>
            <Rate
              value={turn.rating ?? 0}
              onChange={(value) => {
                onRate(turn.id, value);
              }}
            />
          </div>
        ) : null}
      </header>

      <section className={styles.chatDetailConversation}>
        <div className={styles.chatDetailBubbleRow}>
          <div
            className={`${styles.chatDetailBubbleAvatar} ${styles.chatDetailBubbleAvatarUser}`}
          >
            <UserOutlined />
          </div>
          <div
            className={`${styles.chatDetailBubble} ${styles.chatDetailBubbleUser}`}
          >
            <div className={styles.chatDetailBubbleHead}>
              <span className={styles.chatDetailBubbleRole}>
                {intl.formatMessage({ id: 'chat.detail.user' })}
              </span>
              {turn.message?.createdAt ? (
                <time className={styles.chatDetailBubbleTime}>
                  {formatDateTime(turn.message.createdAt)}
                </time>
              ) : null}
            </div>
            <p className={styles.chatDetailBubbleText}>{userContent}</p>
          </div>
        </div>

        <div className={styles.chatDetailBubbleRow}>
          <div
            className={`${styles.chatDetailBubbleAvatar} ${styles.chatDetailBubbleAvatarAgent}`}
          >
            <RobotOutlined />
          </div>
          <div
            className={`${styles.chatDetailBubble} ${styles.chatDetailBubbleAgent}`}
          >
            <div className={styles.chatDetailBubbleHead}>
              <span className={styles.chatDetailBubbleRole}>
                {agentName
                  ? intl.formatMessage(
                      { id: 'chat.detail.agentWithName' },
                      { name: agentName },
                    )
                  : intl.formatMessage({ id: 'chat.detail.agent' })}
              </span>
              {turn.outputMessage?.createdAt ? (
                <time className={styles.chatDetailBubbleTime}>
                  {formatDateTime(turn.outputMessage.createdAt)}
                </time>
              ) : null}
            </div>
            <p className={styles.chatDetailBubbleText}>{assistantContent}</p>
          </div>
        </div>
      </section>

      <section className={styles.chatDetailConversationMeta}>
        <h4 className={styles.chatDetailBlockTitle}>
          {intl.formatMessage({ id: 'chat.detail.conversationMetadata' })}
        </h4>
        <ChatJsonViewer value={conversationMetadata} collapsed={2} />
      </section>

      <ChatTurnStatsPanel turn={turn} />

      {agentRuns.length > 0 ? (
        <section className={styles.chatDetailAgentRuns}>
          <header className={styles.chatDetailPanelHeader}>
            <h4 className={styles.chatDetailPanelTitle}>
              <RobotOutlined />
              {intl.formatMessage({ id: 'chat.detail.agentRuns' })}
              <span className={styles.chatDetailPanelCount}>
                {agentRuns.length}
              </span>
            </h4>
          </header>
          <div className={styles.chatDetailAgentRunList}>
            {agentRuns.map((run) => (
              <ChatAgentRunPanel
                key={run.id}
                run={run}
                onViewAgentRun={onViewAgentRun}
              />
            ))}
          </div>
        </section>
      ) : null}

      {turn.error ? (
        <div className={styles.chatDetailTurnError}>
          <h4 className={styles.chatDetailBlockTitle}>
            {intl.formatMessage({ id: 'agentRun.detail.error' })}
          </h4>
          <pre className={styles.chatDetailCodeBlock}>{turn.error}</pre>
        </div>
      ) : null}
    </article>
  );
}
