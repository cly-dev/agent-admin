import ListPageHeader from '@/components/ListPageHeader';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import CreatePromptTemplateModal from './components/CreatePromptTemplateModal';
import EditPromptTemplateModal from './components/EditPromptTemplateModal';
import PromptTemplateDetailDrawer from './components/PromptTemplateDetailDrawer';
import PromptTemplateFilter from './components/PromptTemplateFilter';
import PromptTemplateTable from './components/PromptTemplateTable';
import styles from './index.module.scss';
import { usePromptTemplateList } from './usePromptTemplateList';

const PromptTemplatePage: React.FC = () => {
  const intl = useIntl();
  const {
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
    agentOptions,
    agentsLoading,
    keyOptions,
    keysLoading,
    handleKeyChange,
    createForm,
    createOpen,
    createSubmitting,
    openCreate,
    setCreateOpen,
    handleCreate,
    detailOpen,
    detailLoading,
    viewingVersion,
    openDetail,
    closeDetail,
    handlePublish,
    publishSubmittingId,
    editForm,
    editOpen,
    editSubmitting,
    editing,
    openEdit,
    setEditOpen,
    handleEdit,
    confirmDelete,
  } = usePromptTemplateList();

  return (
    <PageContainer ghost className={styles.promptTemplatePage}>
      <div className={styles.promptTemplatePageShell}>
        <div className={styles.promptTemplatePageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'promptTemplate.title' })}
            description={intl.formatMessage({ id: 'promptTemplate.subtitle' })}
            actions={
              <button
                type="button"
                className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]"
                onClick={() => void openCreate()}
              >
                <PlusOutlined />
                {intl.formatMessage({ id: 'promptTemplate.add' })}
              </button>
            }
          />

          <div className={styles.promptTemplatePageBody}>
            <PromptTemplateFilter
              form={filterForm}
              appliedFilters={appliedFilters}
              loading={loading}
              onSearch={handleFilterSearch}
              onReset={handleFilterReset}
            />
            <PromptTemplateTable
              list={list}
              loading={loading}
              page={page}
              pageSize={pageSize}
              total={total}
              publishSubmittingId={publishSubmittingId}
              onPageChange={onPageChange}
              onView={(record) => void openDetail(record)}
              onEdit={openEdit}
              onDelete={confirmDelete}
              onPublish={(record) => void handlePublish(record.id)}
            />
          </div>
        </div>
      </div>

      <CreatePromptTemplateModal
        open={createOpen}
        submitting={createSubmitting}
        form={createForm}
        keyOptions={keyOptions}
        keysLoading={keysLoading}
        agentOptions={agentOptions}
        agentsLoading={agentsLoading}
        onKeyChange={handleKeyChange}
        onCancel={() => setCreateOpen(false)}
        onSubmit={() => void handleCreate()}
      />

      <EditPromptTemplateModal
        open={editOpen}
        submitting={editSubmitting}
        editing={editing}
        form={editForm}
        onCancel={() => {
          setEditOpen(false);
        }}
        onSubmit={() => void handleEdit()}
      />

      <PromptTemplateDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        version={viewingVersion}
        publishSubmittingId={publishSubmittingId}
        onClose={closeDetail}
        onEdit={openEdit}
        onDelete={confirmDelete}
        onPublish={(versionId) => void handlePublish(versionId)}
      />
    </PageContainer>
  );
};

export default PromptTemplatePage;
