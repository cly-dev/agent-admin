import ContentEmpty from '@/components/ContentEmpty';
import { AppListSearchInput } from '@/components/AppQueryPanel';
import ListScopeBar from '@/components/ListScopeBar';
import ListPagination from '@/components/ListPagination';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Spin } from 'antd';
import AgentCard from './components/AgentCard';
import styles from './index.module.scss';
import { useAgentList } from './useAgentList';

const AgentPage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    agents,
    loading,
    keyword,
    page,
    pageSize,
    total,
   
    summaryText,
    showEmpty,
    showSearchEmpty,
    showPagination,
    setKeyword,
    onPageChange,
    openDetail,
    openCreate,
    handleDelete,
  } = useAgentList();

  return (
    <PageContainer ghost className={styles.agentPage}>
      <div className={styles.agentPageShell}>
        <div className={styles.agentPageCard}>
          <header className={styles.agentPageHeader}>
            <div className="min-w-0 flex-1">
              <h1 className={styles.agentPageTitle}>
                {intl.formatMessage({ id: 'agent.title' })}
              </h1>
              {summaryText ? (
                <p className={styles.agentPageSummary}>{summaryText}</p>
              ) : (
                <p className={styles.agentPageSummaryMuted}>
                  {intl.formatMessage({ id: 'agent.subtitle' })}
                </p>
              )}
            </div>
            <button
              type="button"
              className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!projectId}
              onClick={openCreate}
            >
              <PlusOutlined />
              {intl.formatMessage({ id: 'agent.add' })}
            </button>
          </header>

          <div className={styles.agentPageToolbar}>
            <ListScopeBar compact />
            <AppListSearchInput
              className="max-w-md"
              placeholder={intl.formatMessage({ id: 'agent.search' })}
              value={keyword}
              disabled={!projectId}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>

          <Spin spinning={loading}>
            <div className={styles.agentPageBody}>
              {!projectId ? (
                <ContentEmpty
                  title={intl.formatMessage({ id: 'agent.empty.noProject.title' })}
                  description={intl.formatMessage({ id: 'agent.empty.noProject.desc' })}
                />
              ) : showEmpty ? (
                <ContentEmpty
                  title={intl.formatMessage({ id: 'agent.empty.none.title' })}
                  description={intl.formatMessage({ id: 'agent.empty.none.desc' })}
                  action={
                    <button
                      type="button"
                      className="app-button-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                      onClick={openCreate}
                    >
                      <PlusOutlined />
                      {intl.formatMessage({ id: 'agent.add' })}
                    </button>
                  }
                />
              ) : showSearchEmpty ? (
                <ContentEmpty
                  title={intl.formatMessage({ id: 'agent.empty.search.title' })}
                  description={intl.formatMessage({ id: 'agent.empty.search.desc' })}
                  action={
                    <button
                      type="button"
                      className="app-button-secondary px-4 py-2 text-sm font-semibold"
                      onClick={() => setKeyword('')}
                    >
                      {intl.formatMessage({ id: 'common.clearSearch' })}
                    </button>
                  }
                />
              ) : (
                <>
                  <div className={styles.agentCardGrid}>
                    {agents.map((agent) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        onConfigure={openDetail}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                  {showPagination ? (
                    <ListPagination
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      onChange={onPageChange}
                    />
                  ) : null}
                </>
              )}
            </div>
          </Spin>
        </div>
      </div>
    </PageContainer>
  );
};

export default AgentPage;
