import ContentEmpty from '@/components/ContentEmpty';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import ListPageHeader from '@/components/ListPageHeader';
import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Link, useIntl } from '@umijs/max';
import PageActionDetailDrawer from './components/PageActionDetailDrawer';
import PageActionFilter from './components/PageActionFilter';
import PageActionTable from './components/PageActionTable';
import styles from './index.module.scss';
import { usePageActionList } from './usePageActionList';

const PageActionPage: React.FC = () => {
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
    viewing,
    toggleSubmittingId,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openCreate,
    openEdit,
    openDetail,
    closeDetail,
    handleToggleActive,
    handleSortOrderBlur,
    confirmDeactivate,
  } = usePageActionList();
  const { toPagePath } = useProjectRoute();

  return (
    <PageContainer ghost className={styles.pageActionPage}>
      <div className={styles.pageActionPageShell}>
        <div className={styles.pageActionPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'pageAction.title' })}
            description={intl.formatMessage({ id: 'pageAction.subtitle' })}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={toPagePath('workflow', 'page-action-run')}
                  className="app-button-secondary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold"
                >
                  <UnorderedListOutlined />
                  {intl.formatMessage({ id: 'pageAction.viewRuns' })}
                </Link>
                <button
                  type="button"
                  className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]"
                  onClick={openCreate}
                  disabled={!projectId}
                >
                  <PlusOutlined />
                  {intl.formatMessage({ id: 'pageAction.add' })}
                </button>
              </div>
            }
          />

          <div className={styles.pageActionPageBody}>
            <PageActionFilter
              form={filterForm}
              appliedFilters={appliedFilters}
              loading={loading}
              onSearch={handleFilterSearch}
              onReset={handleFilterReset}
            />
            <div className={styles.pageActionListContent}>
              {!projectId ? (
                <ContentEmpty
                  title={intl.formatMessage({
                    id: 'pageAction.empty.noProject.title',
                  })}
                  description={intl.formatMessage({
                    id: 'pageAction.empty.noProject.desc',
                  })}
                />
              ) : (
                <PageActionTable
                  list={list}
                  loading={loading}
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  toggleSubmittingId={toggleSubmittingId}
                  onPageChange={onPageChange}
                  onView={(record) => void openDetail(record)}
                  onEdit={openEdit}
                  onToggleActive={(record, next) => {
                    if (!next) {
                      confirmDeactivate(record);
                      return;
                    }
                    void handleToggleActive(record, next);
                  }}
                  onSortOrderBlur={(record, next) =>
                    void handleSortOrderBlur(record, next)
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <PageActionDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        record={viewing}
        onClose={closeDetail}
      />
    </PageContainer>
  );
};

export default PageActionPage;
