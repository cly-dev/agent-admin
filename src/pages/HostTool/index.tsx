import ContentEmpty from '@/components/ContentEmpty';
import ListPageHeader from '@/components/ListPageHeader';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Tabs } from 'antd';
import { useState } from 'react';
import HostPageFilter from './components/HostPageFilter';
import HostPageFormModal from './components/HostPageFormModal';
import HostPageTable from './components/HostPageTable';
import HostToolFilter from './components/HostToolFilter';
import HostToolFormModal from './components/HostToolFormModal';
import HostToolTable from './components/HostToolTable';
import styles from './index.module.scss';
import { useHostPageList } from './useHostPageList';
import { useHostToolList } from './useHostToolList';

const HostToolPage: React.FC = () => {
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState<'generic' | 'pages'>('generic');

  const genericTools = useHostToolList({ genericOnly: true });
  const hostPages = useHostPageList();

  const activeToolHook = genericTools;
  const activePageHook = hostPages;

  return (
    <PageContainer ghost className={styles.hostToolPage}>
      <div className={styles.hostToolPageShell}>
        <div className={styles.hostToolPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'hostTool.title' })}
            description={intl.formatMessage({ id: 'hostTool.subtitle' })}
            actions={
              activeTab === 'generic' ? (
                <button
                  type="button"
                  className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]"
                  onClick={genericTools.openCreate}
                  disabled={!genericTools.projectId}
                >
                  <PlusOutlined />
                  {intl.formatMessage({ id: 'hostTool.addGeneric' })}
                </button>
              ) : (
                <button
                  type="button"
                  className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]"
                  onClick={hostPages.openCreate}
                  disabled={!hostPages.projectId}
                >
                  <PlusOutlined />
                  {intl.formatMessage({ id: 'hostPage.add' })}
                </button>
              )
            }
          />

          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'generic' | 'pages')}
            className={styles.hostToolTabs}
            items={[
              {
                key: 'generic',
                label: intl.formatMessage({ id: 'hostTool.tab.generic' }),
              },
              {
                key: 'pages',
                label: intl.formatMessage({ id: 'hostTool.tab.pages' }),
              },
            ]}
          />

          <div className={styles.hostToolPageBody}>
            {!genericTools.projectId ? (
              <ContentEmpty
                title={intl.formatMessage({
                  id: 'hostTool.empty.noProject.title',
                })}
                description={intl.formatMessage({
                  id: 'hostTool.empty.noProject.desc',
                })}
              />
            ) : activeTab === 'generic' ? (
              <>
                <HostToolFilter
                  form={activeToolHook.filterForm}
                  appliedFilters={activeToolHook.appliedFilters}
                  loading={activeToolHook.loading}
                  onSearch={activeToolHook.handleFilterSearch}
                  onReset={activeToolHook.handleFilterReset}
                />
                <HostToolTable
                  list={activeToolHook.list}
                  loading={activeToolHook.loading}
                  page={activeToolHook.page}
                  pageSize={activeToolHook.pageSize}
                  total={activeToolHook.total}
                  showPageScope={false}
                  onPageChange={activeToolHook.onPageChange}
                  onEdit={activeToolHook.openEdit}
                  onDelete={activeToolHook.confirmDelete}
                />
              </>
            ) : (
              <>
                <HostPageFilter
                  form={activePageHook.filterForm}
                  appliedFilters={activePageHook.appliedFilters}
                  loading={activePageHook.loading}
                  onSearch={activePageHook.handleFilterSearch}
                  onReset={activePageHook.handleFilterReset}
                />
                <HostPageTable
                  list={activePageHook.list}
                  loading={activePageHook.loading}
                  page={activePageHook.page}
                  pageSize={activePageHook.pageSize}
                  total={activePageHook.total}
                  onPageChange={activePageHook.onPageChange}
                  onView={activePageHook.openDetail}
                  onEdit={activePageHook.openEdit}
                  onDelete={activePageHook.confirmDelete}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <HostToolFormModal
        open={genericTools.formOpen}
        submitting={genericTools.formSubmitting}
        editing={genericTools.editing}
        form={genericTools.toolForm}
        onCancel={() => genericTools.setFormOpen(false)}
        onSubmit={() => void genericTools.handleFormSubmit()}
      />

      <HostPageFormModal
        open={hostPages.formOpen}
        submitting={hostPages.formSubmitting}
        editing={hostPages.editing}
        form={hostPages.pageForm}
        onCancel={() => hostPages.setFormOpen(false)}
        onSubmit={() => void hostPages.handleFormSubmit()}
      />
    </PageContainer>
  );
};

export default HostToolPage;
