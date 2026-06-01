import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Form, InputNumber, Modal } from 'antd';
import { useEffect } from 'react';
import UserFilter from './components/UserFilter';
import UserTable from './components/UserTable';
import styles from './index.module.scss';
import { useUserAppList } from './useUserAppList';

const UserPage: React.FC = () => {
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
    editing,
    loadAll,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openCreate,
    closeEditor,
    submitEditor,
    remove,
  } = useUserAppList();

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return (
    <PageContainer ghost className={styles.userPage}>
      <div className={styles.userPageShell}>
        <div className={styles.userPageCard}>
          <header className={styles.userPageHeader}>
            <div>
              <h1 className={styles.userPageTitle}>{intl.formatMessage({ id: 'user.title' })}</h1>
              <p className={styles.userPageSubtitle}>{intl.formatMessage({ id: 'user.subtitle' })}</p>
            </div>
            <button
              type="button"
              className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold"
              onClick={openCreate}
            >
              {intl.formatMessage({ id: 'user.add' })}
            </button>
          </header>

          <UserFilter
            form={filterForm}
            appliedFilters={appliedFilters}
            loading={loading}
            onSearch={handleFilterSearch}
            onReset={handleFilterReset}
          />

          <UserTable
            list={list}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            onDelete={remove}
          />
        </div>
      </div>

      <Modal
        title={
          editing
            ? intl.formatMessage({ id: 'user.editTitle' })
            : intl.formatMessage({ id: 'user.createTitle' })
        }
        open={editorOpen}
        onCancel={closeEditor}
        onOk={() => void submitEditor()}
        confirmLoading={submitting}
      >
        <Form form={editorForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="userId"
            label={intl.formatMessage({ id: 'user.column.userId' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'user.form.userIdRequired' }) }]}
          >
            <InputNumber className="app-input w-full" controls={false} min={1} />
          </Form.Item>
          <Form.Item
            name="appId"
            label={intl.formatMessage({ id: 'user.column.appId' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'user.form.appIdRequired' }) }]}
          >
            <InputNumber className="app-input w-full" controls={false} min={1} />
          </Form.Item>
          <Form.Item
            name="roleId"
            label={intl.formatMessage({ id: 'user.column.roleId' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'user.form.roleIdRequired' }) }]}
          >
            <InputNumber className="app-input w-full" controls={false} min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserPage;
