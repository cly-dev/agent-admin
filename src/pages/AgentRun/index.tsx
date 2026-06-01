import ContentEmpty from '@/components/ContentEmpty';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import AgentRunFilter from './components/AgentRunFilter';
import AgentRunTable from './components/AgentRunTable';
import styles from './index.module.scss';
import { useAgentRunList } from './useAgentRunList';

const AgentRunPage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    filterForm,
    appliedFilters,
    runs,
    loading,
    page,
    pageSize,
    total,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    runDetailPath,
  } = useAgentRunList();

  return (
    <PageContainer ghost className={styles.agentRunPage}>
      <div className={styles.agentRunPageShell}>
        <div className={styles.agentRunPageCard}>
          <header className={styles.agentRunPageHeader}>
            <h1 className={styles.agentRunPageTitle}>
              {intl.formatMessage({ id: 'agentRun.title' })}
            </h1>
            <p className={styles.agentRunPageSubtitle}>
              {intl.formatMessage({ id: 'agentRun.subtitle' })}
            </p>
          </header>

          <div className={styles.agentRunPageBody}>
            {!projectId ? (
              <ContentEmpty
                title={intl.formatMessage({ id: 'agentRun.empty.noProject.title' })}
                description={intl.formatMessage({ id: 'agentRun.empty.noProject.desc' })}
              />
            ) : (
              <>
                <AgentRunFilter
                  form={filterForm}
                  appliedFilters={appliedFilters}
                  loading={loading}
                  onSearch={handleFilterSearch}
                  onReset={handleFilterReset}
                />
                <AgentRunTable
                  runs={runs}
                  loading={loading}
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={onPageChange}
                  detailPath={runDetailPath}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AgentRunPage;
