import ContentEmpty from '@/components/ContentEmpty';
import ListPageHeader from '@/components/ListPageHeader';
import { PlusOutlined, SwapOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import FlowFilter from './components/FlowFilter';
import FlowTable from './components/FlowTable';
import styles from '../Workflow/index.module.scss';
import { useFlowList } from './useFlowList';

const FlowPage: React.FC = () => {
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
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openCreate,
    openDetail,
    openMigrate,
    confirmDelete,
  } = useFlowList();

  const showEmptyList = Boolean(projectId) && !loading && list.length === 0;

  return (
    <PageContainer ghost className={styles.workflowPage}>
      <div className={styles.workflowPageShell}>
        <div className={styles.workflowPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'flow.title' })}
            description={intl.formatMessage({ id: 'flow.subtitle' })}
            meta={
              projectId && total > 0
                ? intl.formatMessage(
                    { id: 'flow.list.headerMeta' },
                    { total },
                  )
                : undefined
            }
            actions={
              <div className={styles.headerActions}>
                <button
                  type="button"
                  className={`app-button-secondary ${styles.headerSecondaryAction}`}
                  onClick={openMigrate}
                  disabled={!projectId}
                >
                  <SwapOutlined />
                  {intl.formatMessage({ id: 'flow.link.migrate' })}
                </button>
                <button
                  type="button"
                  className={`app-button-primary ${styles.headerPrimaryAction}`}
                  onClick={() => openCreate()}
                  disabled={!projectId}
                >
                  <PlusOutlined />
                  {intl.formatMessage({ id: 'flow.add' })}
                </button>
              </div>
            }
          />

          <div className={styles.workflowPageBody}>
            {!projectId ? (
              <ContentEmpty
                title={intl.formatMessage({
                  id: 'flow.empty.noProject.title',
                })}
                description={intl.formatMessage({
                  id: 'flow.empty.noProject.desc',
                })}
              />
            ) : (
              <>
                <FlowFilter
                  form={filterForm}
                  appliedFilters={appliedFilters}
                  loading={loading}
                  onSearch={handleFilterSearch}
                  onReset={handleFilterReset}
                />

                <div className={styles.workflowListContent}>
                  {showEmptyList ? (
                    <ContentEmpty
                      title={intl.formatMessage({
                        id: 'flow.list.emptyTitle',
                      })}
                      description={intl.formatMessage({
                        id: 'flow.list.emptyDesc',
                      })}
                      action={
                        <button
                          type="button"
                          className="app-button-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                          onClick={() => openCreate()}
                        >
                          <PlusOutlined />
                          {intl.formatMessage({ id: 'flow.add' })}
                        </button>
                      }
                    />
                  ) : (
                    <FlowTable
                      list={list}
                      loading={loading}
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      onPageChange={onPageChange}
                      onRowClick={openDetail}
                      onDelete={confirmDelete}
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

export default FlowPage;
