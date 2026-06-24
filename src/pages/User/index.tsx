import ListPageHeader from '@/components/ListPageHeader';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import UserFilter from './components/UserFilter';
import UserTable from './components/UserTable';
import styles from './index.module.scss';
import { useUserList } from './useUserList';

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
    loadAll,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    openCreate,
    closeEditor,
    submitEditor,
    remove,
  } = useUserList();

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return (
    <PageContainer ghost className={styles.userPage}>
      <div className={styles.userPageShell}>
        <div className={styles.userPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'user.title' })}
            description={intl.formatMessage({ id: 'user.subtitle' })}
            actions={
              <button
                type="button"
                className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]"
                onClick={openCreate}
              >
                {intl.formatMessage({ id: 'user.add' })}
              </button>
            }
          />

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
        title={intl.formatMessage({ id: 'user.createTitle' })}
        open={editorOpen}
        onCancel={closeEditor}
        onOk={() => void submitEditor()}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={editorForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="email"
            label={intl.formatMessage({ id: 'user.column.email' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'user.form.emailRequired' }),
              },
              {
                type: 'email',
                message: intl.formatMessage({ id: 'user.form.emailInvalid' }),
              },
            ]}
          >
            <Input
              className="app-input"
              placeholder={intl.formatMessage({
                id: 'user.form.emailPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="username"
            label={intl.formatMessage({ id: 'user.column.username' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'user.form.usernameRequired',
                }),
              },
            ]}
          >
            <Input
              className="app-input"
              placeholder={intl.formatMessage({
                id: 'user.form.usernamePlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="employeeId"
            label={intl.formatMessage({ id: 'user.column.employeeId' })}
            extra={intl.formatMessage({ id: 'user.form.employeeIdHint' })}
          >
            <Input
              className="app-input"
              placeholder={intl.formatMessage({
                id: 'user.form.employeeIdPlaceholder',
              })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserPage;
