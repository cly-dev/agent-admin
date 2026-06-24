import ContentEmpty from '@/components/ContentEmpty';
import ListPageHeader from '@/components/ListPageHeader';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import styles from '../index.module.scss';
import MessageFeedbackDetailDrawer from './components/MessageFeedbackDetailDrawer';
import MessageFeedbackFilter from './components/MessageFeedbackFilter';
import MessageFeedbackSummaryPanel from './components/MessageFeedbackSummaryPanel';
import MessageFeedbackTable from './components/MessageFeedbackTable';
import { useMessageFeedbackList } from './useMessageFeedbackList';

const MessageFeedbackPage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    filterForm,
    appliedFilters,
    list,
    loading,
    page,
    pageSize,
    total,
    summary,
    summaryLoading,
    summaryDays,
    summaryDayOptions,
    setSummaryDays,
    agentsLoading,
    agentOptions,
    reasonTagsLoading,
    reasonTagOptions,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    detailId,
    detail,
    detailLoading,
    openDetail,
    closeDetail,
    sessionDetailPath,
  } = useMessageFeedbackList();

  return (
    <PageContainer ghost className={styles.chatPage}>
      <div className={styles.chatPageShell}>
        <div className={styles.chatPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'messageFeedback.title' })}
            description={intl.formatMessage({ id: 'messageFeedback.subtitle' })}
          />

          <div className={styles.chatPageBody}>
            {!projectId ? (
              <ContentEmpty
                title={intl.formatMessage({
                  id: 'messageFeedback.empty.noProject.title',
                })}
                description={intl.formatMessage({
                  id: 'messageFeedback.empty.noProject.desc',
                })}
              />
            ) : (
              <>
                <MessageFeedbackSummaryPanel
                  summary={summary}
                  loading={summaryLoading}
                  days={summaryDays}
                  dayOptions={summaryDayOptions}
                  onDaysChange={setSummaryDays}
                />

                <section className={styles.feedbackListSection}>
                  <h2 className={styles.feedbackListSectionTitle}>
                    {intl.formatMessage({ id: 'messageFeedback.list.title' })}
                  </h2>
                  <MessageFeedbackFilter
                    form={filterForm}
                    appliedFilters={appliedFilters}
                    loading={loading}
                    agentOptions={agentOptions}
                    agentsLoading={agentsLoading}
                    reasonTagOptions={reasonTagOptions}
                    reasonTagsLoading={reasonTagsLoading}
                    onSearch={handleFilterSearch}
                    onReset={handleFilterReset}
                  />
                  <MessageFeedbackTable
                    list={list}
                    loading={loading}
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={onPageChange}
                    onViewDetail={(id) => void openDetail(id)}
                    sessionDetailPath={sessionDetailPath}
                  />
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      <MessageFeedbackDetailDrawer
        open={detailId !== null}
        loading={detailLoading}
        detail={detail}
        sessionDetailPath={sessionDetailPath}
        onClose={closeDetail}
      />
    </PageContainer>
  );
};

export default MessageFeedbackPage;
