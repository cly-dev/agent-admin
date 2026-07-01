import ContentEmpty from '@/components/ContentEmpty';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import ListPageHeader from '@/components/ListPageHeader';
import { ApiOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Link, useIntl } from '@umijs/max';
import WorkflowConceptStrip from './components/WorkflowConceptStrip';
import WorkflowFilter from './components/WorkflowFilter';
import WorkflowTable from './components/WorkflowTable';
import styles from './index.module.scss';
import { useWorkflowList } from './useWorkflowList';

const WorkflowPage: React.FC = () => {
  const intl = useIntl();
  const { toPagePath } = useProjectRoute();
  const {
    projectId,
    filterForm,
    appliedFilters,
    list,
    loading,
    page,
    pageSize,
    total,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openCreate,
    openDetail,
  } = useWorkflowList();

  const showEmptyList = Boolean(projectId) && !loading && list.length === 0;

  return (
    <PageContainer ghost className={styles.workflowPage}>
      <div className={styles.workflowPageShell}>
        <div className={styles.workflowPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'workflow.title' })}
            description={intl.formatMessage({ id: 'workflow.subtitle' })}
            meta={
              projectId && total > 0
                ? intl.formatMessage({ id: 'workflow.list.headerMeta' }, { total })
                : undefined
            }
            actions={
              <div className={styles.headerActions}>
                <Link
                  to={toPagePath('workflow', 'frontend-tool-flow')}
                  className={`app-button-secondary ${styles.headerSecondaryAction}`}
                >
                  <ApiOutlined />
                  {intl.formatMessage({ id: 'workflow.link.pageActions' })}
                </Link>
                <button
                  type="button"
                  className={`app-button-primary ${styles.headerPrimaryAction}`}
                  onClick={openCreate}
                  disabled={!projectId}
                >
                  <PlusOutlined />
                  {intl.formatMessage({ id: 'workflow.add' })}
                </button>
              </div>
            }
          />

          <div className={styles.workflowPageBody}>
            {!projectId ? (
              <ContentEmpty
                title={intl.formatMessage({ id: 'workflow.empty.noProject.title' })}
                description={intl.formatMessage({
                  id: 'workflow.empty.noProject.desc',
                })}
              />
            ) : (
              <>
                <WorkflowFilter
                  form={filterForm}
                  appliedFilters={appliedFilters}
                  loading={loading}
                  onSearch={handleFilterSearch}
                  onReset={handleFilterReset}
                />

                <WorkflowConceptStrip total={total} list={list} />

                <div className={styles.workflowListContent}>
                  {showEmptyList ? (
                    <ContentEmpty
                      title={intl.formatMessage({ id: 'workflow.list.emptyTitle' })}
                      description={intl.formatMessage({
                        id: 'workflow.list.emptyDesc',
                      })}
                      action={
                        <button
                          type="button"
                          className="app-button-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                          onClick={openCreate}
                        >
                          <PlusOutlined />
                          {intl.formatMessage({ id: 'workflow.add' })}
                        </button>
                      }
                    />
                  ) : (
                    <WorkflowTable
                      list={list}
                      loading={loading}
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      onPageChange={onPageChange}
                      onRowClick={openDetail}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default WorkflowPage;
