import {
  AppListQueryToolbar,
  AppListSearchInput,
} from '@/components/AppQueryPanel';
import ContentEmpty from '@/components/ContentEmpty';
import ListPageHeader from '@/components/ListPageHeader';
import ListPagination from '@/components/ListPagination';
import { CloudDownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Checkbox, Spin } from 'antd';
import ImportToolsFromSwaggerModal from './components/ImportToolsFromSwaggerModal';
import ToolCard from './components/ToolCard';
import styles from './index.module.scss';
import { useTools } from './useTools';

const ToolPage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    tools,
    loading,
    keyword,
    isSearchActive,
    summaryText,
    showEmpty,
    showPagination,
    page,
    pageSize,
    total,
    onPageChange,
    setKeyword,
    openCreate,
    openConfigure,
    handleDelete,
    handleToggleActive,
    selectedIds,
    selectedCount,
    isAllCurrentPageSelected,
    isSelectionIndeterminate,
    batchSubmitting,
    toggleSelect,
    toggleSelectAllCurrentPage,
    clearSelection,
    handleBatchEnable,
    handleBatchDisable,
    importModalOpen,
    importSubmitting,
    importIntegrations,
    importIntegrationsLoading,
    openImportModal,
    onImportModalOpenChange,
    handleImportFromSwagger,
  } = useTools();

  const showBatchBar = Boolean(projectId) && !showEmpty;

  return (
    <PageContainer ghost className={styles.toolPage}>
      <div className={styles.toolPageShell}>
        <div className={styles.toolPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'tool.title' })}
            description={intl.formatMessage({ id: 'tool.subtitle' })}
            meta={summaryText || undefined}
            actions={
              <>
                <button
                  type="button"
                  className="app-button-secondary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!projectId}
                  onClick={openImportModal}
                >
                  <CloudDownloadOutlined />
                  {intl.formatMessage({ id: 'tool.import.action' })}
                </button>
                <button
                  type="button"
                  className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!projectId}
                  onClick={openCreate}
                >
                  <PlusOutlined />
                  {intl.formatMessage({ id: 'tool.add' })}
                </button>
              </>
            }
          />

          <AppListQueryToolbar showProjectScope>
            <AppListSearchInput
              className="max-w-md"
              placeholder={intl.formatMessage({ id: 'tool.search' })}
              value={keyword}
              disabled={!projectId}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </AppListQueryToolbar>

          {showBatchBar ? (
            <div className={styles.toolBatchBar}>
              <Checkbox
                checked={isAllCurrentPageSelected}
                indeterminate={isSelectionIndeterminate}
                disabled={loading || batchSubmitting || tools.length === 0}
                onChange={(event) =>
                  toggleSelectAllCurrentPage(event.target.checked)
                }
              >
                {intl.formatMessage({ id: 'tool.batch.selectAllPage' })}
              </Checkbox>

              {selectedCount > 0 ? (
                <>
                  <span className={styles.toolBatchDivider} aria-hidden />
                  <span className={styles.toolBatchCount}>
                    {intl.formatMessage(
                      { id: 'tool.batch.selected' },
                      { count: selectedCount },
                    )}
                  </span>
                  <div className={styles.toolBatchActions}>
                    <button
                      type="button"
                      className={styles.toolBatchEnable}
                      disabled={batchSubmitting}
                      onClick={() => void handleBatchEnable()}
                    >
                      {intl.formatMessage({ id: 'tool.batch.enable' })}
                    </button>
                    <button
                      type="button"
                      className={styles.toolBatchDisable}
                      disabled={batchSubmitting}
                      onClick={() => void handleBatchDisable()}
                    >
                      {intl.formatMessage({ id: 'tool.batch.disable' })}
                    </button>
                    <button
                      type="button"
                      className={styles.toolBatchClear}
                      disabled={batchSubmitting}
                      onClick={clearSelection}
                    >
                      {intl.formatMessage({ id: 'tool.batch.clear' })}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          <Spin spinning={loading || batchSubmitting}>
            <div className={styles.toolPageBody}>
              {!projectId ? (
                <ContentEmpty
                  title={intl.formatMessage({
                    id: 'tool.empty.noProject.title',
                  })}
                  description={intl.formatMessage({
                    id: 'tool.empty.noProject.desc',
                  })}
                />
              ) : showEmpty ? (
                <ContentEmpty
                  title={
                    isSearchActive
                      ? intl.formatMessage({ id: 'tool.empty.search.title' })
                      : intl.formatMessage({ id: 'tool.empty.none.title' })
                  }
                  description={
                    isSearchActive
                      ? intl.formatMessage({ id: 'tool.empty.search.desc' })
                      : intl.formatMessage({ id: 'tool.empty.none.desc' })
                  }
                  action={
                    isSearchActive ? (
                      <button
                        type="button"
                        className="app-button-secondary px-4 py-2 text-sm font-semibold"
                        onClick={() => setKeyword('')}
                      >
                        {intl.formatMessage({ id: 'common.clearSearch' })}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="app-button-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                        onClick={openCreate}
                      >
                        <PlusOutlined />
                        {intl.formatMessage({ id: 'tool.add' })}
                      </button>
                    )
                  }
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {tools.map((tool) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        selected={selectedIds.includes(tool.id)}
                        onSelectChange={(checked) =>
                          toggleSelect(tool.id, checked)
                        }
                        onConfigure={openConfigure}
                        onToggleActive={handleToggleActive}
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

      <ImportToolsFromSwaggerModal
        open={importModalOpen}
        submitting={importSubmitting}
        integrations={importIntegrations}
        integrationsLoading={importIntegrationsLoading}
        onOpenChange={onImportModalOpenChange}
        onSubmit={handleImportFromSwagger}
      />
    </PageContainer>
  );
};

export default ToolPage;
