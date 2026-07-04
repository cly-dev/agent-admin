import ContentEmpty from '@/components/ContentEmpty';
import ListPageHeader from '@/components/ListPageHeader';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import PageAgentRunDetailDrawer from './components/PageAgentRunDetailDrawer';
import PageAgentRunFilter from './components/PageAgentRunFilter';
import PageAgentRunTable from './components/PageAgentRunTable';
import styles from './index.module.scss';
import { usePageAgentRunList } from './usePageAgentRunList';

const PageAgentRunPage: React.FC = () => {
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
    detailOpen,
    detailLoading,
    detail,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openDetail,
    closeDetail,
  } = usePageAgentRunList();

  return (
    <PageContainer ghost className={styles.pageAgentRunPage}>
      <div className={styles.pageAgentRunPageShell}>
        <div className={styles.pageAgentRunPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'pageAgentRun.title' })}
            description={intl.formatMessage({ id: 'pageAgentRun.subtitle' })}
          />

          <div className={styles.pageAgentRunPageBody}>
            {!projectId ? (
              <ContentEmpty
                title={intl.formatMessage({
                  id: 'pageAgentRun.empty.noProject.title',
                })}
                description={intl.formatMessage({
                  id: 'pageAgentRun.empty.noProject.desc',
                })}
              />
            ) : (
              <div className={styles.pageAgentRunListContent}>
                <PageAgentRunFilter
                  form={filterForm}
                  appliedFilters={appliedFilters}
                  loading={loading}
                  onSearch={handleFilterSearch}
                  onReset={handleFilterReset}
                />
                <PageAgentRunTable
                  list={list}
                  loading={loading}
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={onPageChange}
                  onView={openDetail}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <PageAgentRunDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        detail={detail}
        onClose={closeDetail}
      />
    </PageContainer>
  );
};

export default PageAgentRunPage;
