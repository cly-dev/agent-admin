import ContentEmpty from '@/components/ContentEmpty';
import { AppListSearchInput } from '@/components/AppQueryPanel';
import ListScopeBar from '@/components/ListScopeBar';
import ListPagination from '@/components/ListPagination';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Spin } from 'antd';
import IntegrationCard from './components/IntegrationCard';
import IntegrationFormModal from './components/IntegrationFormModal';
import styles from './index.module.scss';
import { useIntegrations } from './useIntegrations';

const IntegrationsPage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    integrations,
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
    modalOpen,
    editing,
    submitting,
    setKeyword,
    openCreate,
    openConfigure,
    handleDelete,
    handleSubmit,
    onModalOpenChange,
  } = useIntegrations();

  return (
    <PageContainer ghost className={styles.integrationPage}>
      <div className={styles.integrationPageShell}>
        <div className={styles.integrationPageCard}>
          <header className={styles.integrationPageHeader}>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-[-0.02em] text-on-surface">
                {intl.formatMessage({ id: 'integration.title' })}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface/60">
                {intl.formatMessage({ id: 'integration.subtitle' })}
                {summaryText ? (
                  <span className="mt-1 block text-xs font-medium text-on-surface/45">
                    {summaryText}
                  </span>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!projectId}
              onClick={openCreate}
            >
              <PlusOutlined />
              {intl.formatMessage({ id: 'integration.add' })}
            </button>
          </header>

          <div className={styles.integrationPageSearch}>
            <ListScopeBar compact />
            <AppListSearchInput
              className="max-w-md"
              placeholder={intl.formatMessage({ id: 'integration.search' })}
              value={keyword}
              disabled={!projectId}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>

          <Spin spinning={loading}>
            <div className={styles.integrationPageBody}>
              {!projectId ? (
                <ContentEmpty
                  title={intl.formatMessage({ id: 'integration.empty.noProject.title' })}
                  description={intl.formatMessage({ id: 'integration.empty.noProject.desc' })}
                />
              ) : showEmpty ? (
                <ContentEmpty
                  title={
                    isSearchActive
                      ? intl.formatMessage({ id: 'integration.empty.search.title' })
                      : intl.formatMessage({ id: 'integration.empty.none.title' })
                  }
                  description={
                    isSearchActive
                      ? intl.formatMessage({ id: 'integration.empty.search.desc' })
                      : intl.formatMessage({ id: 'integration.empty.none.desc' })
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
                        {intl.formatMessage({ id: 'integration.add' })}
                      </button>
                    )
                  }
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {integrations.map((integration) => (
                      <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onConfigure={openConfigure}
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

        <IntegrationFormModal
          key={editing?.id ?? 'create'}
          open={modalOpen}
          editing={editing}
          submitting={submitting}
          onOpenChange={onModalOpenChange}
          onSubmit={handleSubmit}
        />
      </div>
    </PageContainer>
  );
};

export default IntegrationsPage;
