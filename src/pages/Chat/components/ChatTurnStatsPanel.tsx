import type { MessageTurn } from '@/types/message-turn';
import { BarChartOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { useMemo } from 'react';
import { buildTurnRunMetadata } from '../chatTurnDisplay';
import styles from '../index.module.scss';
import { ChatJsonViewer } from './ChatJsonViewer';

type ChatTurnStatsPanelProps = {
  turn: MessageTurn;
};

export function ChatTurnStatsPanel({ turn }: ChatTurnStatsPanelProps) {
  const intl = useIntl();
  const metadata = useMemo(() => buildTurnRunMetadata(turn), [turn]);

  return (
    <section className={styles.chatDetailStatsPanel}>
      <header className={styles.chatDetailPanelHeader}>
        <h4 className={styles.chatDetailPanelTitle}>
          <BarChartOutlined />
          {intl.formatMessage({ id: 'chat.detail.runStats' })}
        </h4>
      </header>
      <ChatJsonViewer value={metadata} collapsed={2} />
    </section>
  );
}
