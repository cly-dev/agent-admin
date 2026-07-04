import ListPageHeader from '@/components/ListPageHeader';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { useEffect } from 'react';
import AdminUserFilter from './components/AdminUserFilter';
import AdminUserFormModal from './components/AdminUserFormModal';
import AdminUserGeneratedPasswordModal from './components/AdminUserGeneratedPasswordModal';
import AdminUserTable from './components/AdminUserTable';
import styles from './index.module.scss';
import { useAdminUserList } from './useAdminUserList';

const AdminUserPage: React.FC = () => {
  const intl = useIntl();
  const {
    filterForm,
    editorForm,
    appliedFilters,
    list,
    total,
    page,
    pageSize,
    loading,
    submitting,
    editorOpen,
    editingRecord,
    generatedPassword,
    loadList,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openCreate,
    openEdit,
    closeEditor,
    submitEditor,
    resetPassword,
    closeGeneratedPassword,
  } = useAdminUserList();

  useEffect(() => {
    void loadList(1, DEFAULT_PAGE_SIZE, {});
  }, [loadList]);

  return (
    <PageContainer ghost className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.card}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'adminUser.title' })}
            description={intl.formatMessage({ id: 'adminUser.subtitle' })}
            actions={
              <button
                type="button"
                className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]"
                onClick={openCreate}
              >
                {intl.formatMessage({ id: 'adminUser.add' })}
              </button>
            }
          />

          <AdminUserFilter
            form={filterForm}
            appliedFilters={appliedFilters}
            loading={loading}
            onSearch={handleFilterSearch}
            onReset={handleFilterReset}
          />

          <AdminUserTable
            list={list}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            onEdit={openEdit}
            onResetPassword={resetPassword}
          />
        </div>
      </div>

      <AdminUserFormModal
        open={editorOpen}
        submitting={submitting}
        isEdit={Boolean(editingRecord)}
        form={editorForm}
        onCancel={closeEditor}
        onSubmit={submitEditor}
      />

      <AdminUserGeneratedPasswordModal
        payload={generatedPassword}
        onClose={closeGeneratedPassword}
      />
    </PageContainer>
  );
};

export default AdminUserPage;
