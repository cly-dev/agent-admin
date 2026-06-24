import { AppDetailPage } from '@/components/AppDetailHeader';
import ContentEmpty from '@/components/ContentEmpty';
import { history, useIntl, useParams } from '@umijs/max';
import { ChatSessionSummary } from '../components/ChatSessionSummary';
import { ChatTurnCard } from '../components/ChatTurnCard';
import styles from '../index.module.scss';
import { useChatDetail } from '../useChatDetail';

const ChatDetailPage: React.FC = () => {
  const intl = useIntl();
  const { id } = useParams<{ id: string }>();
  const {
    projectId,
    loading,
    session,
    turns,
    userLabel,
    agentLabel,
    projectLabel,
    isValidSessionId,
    listPath,
    sessionFeedbackPath,
    handleRate,
    viewAgentRunDetail,
  } = useChatDetail(id);

  const handleBack = () => {
    history.push(listPath);
  };

  const pageTitle =
    session?.title?.trim() ||
    session?.id ||
    intl.formatMessage({ id: 'chat.detail.title' });

  const pageSubtitle = session?.updatedAt
    ? intl.formatMessage(
        { id: 'chat.detail.updatedAtValue' },
        { time: session.updatedAt },
      )
    : session?.id;

  let body: React.ReactNode = null;

  if (!projectId) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'chat.empty.noProject.title' })}
        description={intl.formatMessage({ id: 'chat.empty.noProject.desc' })}
      />
    );
  } else if (!isValidSessionId) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'chat.detail.invalidId' })}
        description={intl.formatMessage({ id: 'chat.detail.notFoundDesc' })}
      />
    );
  } else if (!loading && !session) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'chat.detail.notFound' })}
        description={intl.formatMessage({ id: 'chat.detail.notFoundDesc' })}
      />
    );
  } else if (session) {
    body = (
      <>
        <ChatSessionSummary
          session={session}
          projectLabel={projectLabel}
          agentLabel={agentLabel}
          userLabel={userLabel}
          turnCount={turns.length}
          feedbackPath={sessionFeedbackPath}
        />

        <section className={styles.chatDetailTimeline}>
          <header className={styles.chatDetailTimelineHeader}>
            <h2 className={styles.chatDetailTimelineTitle}>
              {intl.formatMessage({ id: 'chat.detail.timeline' })}
            </h2>
            <p className={styles.chatDetailTimelineDesc}>
              {intl.formatMessage({ id: 'chat.detail.timelineDesc' })}
            </p>
          </header>

          {turns.length === 0 ? (
            <ContentEmpty
              title={intl.formatMessage({ id: 'chat.detail.noMessages' })}
              description={intl.formatMessage({
                id: 'chat.detail.noMessagesDesc',
              })}
            />
          ) : (
            <div className={styles.chatDetailTurnList}>
              {turns.map((turn) => (
                <ChatTurnCard
                  key={turn.id}
                  turn={turn}
                  onViewAgentRun={viewAgentRunDetail}
                  onRate={handleRate}
                />
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  return (
    <AppDetailPage
      loading={loading}
      pageClassName={styles.chatDetailPage}
      onBack={handleBack}
      title={pageTitle}
      subtitle={pageSubtitle}
    >
      <div className={styles.chatDetailBody}>{body}</div>
    </AppDetailPage>
  );
};

export default ChatDetailPage;
