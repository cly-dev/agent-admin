import ContentEmpty from '@/components/ContentEmpty';
import ListPageHeader from '@/components/ListPageHeader';
import { PageContainer } from '@ant-design/pro-components';
import { Link, useIntl } from '@umijs/max';
import PageActionRunFilter from './components/PageActionRunFilter';
import PageActionRunTable from './components/PageActionRunTable';
import styles from './index.module.scss';
import { usePageActionRunList } from './usePageActionRunList';

const PageActionRunPage: React.FC = () => {
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
    initialPageActionId,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    runDetailPath,
    configListPath,
  } = usePageActionRunList();

  const description = initialPageActionId
    ? intl.formatMessage(
        { id: 'pageActionRun.subtitleFiltered' },
        { pageActionId: initialPageActionId },
      )
    : intl.formatMessage({ id: 'pageActionRun.subtitle' });

  return (
    <PageContainer ghost className={styles.pageActionRunPage}>
      <div className={styles.pageActionRunPageShell}>
        <div className={styles.pageActionRunPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'pageActionRun.title' })}
            description={description}
            actions={
              <div className={styles.headerActions}>
                <Link
                  to={configListPath()}
                  className="app-button-secondary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold"
                >
                  {intl.formatMessage({ id: 'pageActionRun.backToConfig' })}
                </Link>
              </div>
            }
          />

          <div className={styles.pageActionRunPageBody}>
            {!projectId ? (
              <ContentEmpty
                title={intl.formatMessage({
                  id: 'pageActionRun.empty.noProject.title',
                })}
                description={intl.formatMessage({
                  id: 'pageActionRun.empty.noProject.desc',
                })}
              />
            ) : (
              <div className={styles.pageActionRunListContent}>
                <PageActionRunFilter
                  form={filterForm}
                  appliedFilters={appliedFilters}
                  loading={loading}
                  onSearch={handleFilterSearch}
                  onReset={handleFilterReset}
                />
                <PageActionRunTable
                  list={list}
                  loading={loading}
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={onPageChange}
                  detailPath={runDetailPath}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default PageActionRunPage;
