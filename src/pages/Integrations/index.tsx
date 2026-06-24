import {
  AppListQueryToolbar,
  AppListSearchInput,
} from '@/components/AppQueryPanel';
import ContentEmpty from '@/components/ContentEmpty';
import ListPageHeader from '@/components/ListPageHeader';
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
          <ListPageHeader
            title={intl.formatMessage({ id: 'integration.title' })}
            description={intl.formatMessage({ id: 'integration.subtitle' })}
            meta={summaryText || undefined}
            actions={
              <button
                type="button"
                className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!projectId}
                onClick={openCreate}
              >
                <PlusOutlined />
                {intl.formatMessage({ id: 'integration.add' })}
              </button>
            }
          />

          <AppListQueryToolbar showProjectScope>
            <AppListSearchInput
              className="max-w-md"
              placeholder={intl.formatMessage({ id: 'integration.search' })}
              value={keyword}
              disabled={!projectId}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </AppListQueryToolbar>

          <Spin spinning={loading}>
            <div className={styles.integrationPageBody}>
              {!projectId ? (
                <ContentEmpty
                  title={intl.formatMessage({
                    id: 'integration.empty.noProject.title',
                  })}
                  description={intl.formatMessage({
                    id: 'integration.empty.noProject.desc',
                  })}
                />
              ) : showEmpty ? (
                <ContentEmpty
                  title={
                    isSearchActive
                      ? intl.formatMessage({
                          id: 'integration.empty.search.title',
                        })
                      : intl.formatMessage({
                          id: 'integration.empty.none.title',
                        })
                  }
                  description={
                    isSearchActive
                      ? intl.formatMessage({
                          id: 'integration.empty.search.desc',
                        })
                      : intl.formatMessage({
                          id: 'integration.empty.none.desc',
                        })
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
