import { AppDetailPage } from '@/components/AppDetailHeader';
import ContentEmpty from '@/components/ContentEmpty';
import { useIntl } from '@umijs/max';
import PageActionForm from '../components/PageActionForm';
import styles from '../index.module.scss';
import { usePageActionEdit } from '../usePageActionEdit';

const PageActionEditPage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    currentProject,
    isValidId,
    record,
    loading,
    form,
    hostTools,
    hostToolsLoading,
    submitting,
    workflowBinding,
    setWorkflowBinding,
    hostToolIdLocked,
    handlePushHostToolResolved,
    handleBack,
    handleHostToolChange,
    handleSubmit,
  } = usePageActionEdit();

  const subtitle = record?.name
    ? intl.formatMessage(
        { id: 'pageAction.detail.editSubtitle' },
        { name: record.name, actionKey: record.actionKey },
      )
    : currentProject?.name
      ? intl.formatMessage(
          { id: 'pageAction.detail.createSubtitle' },
          { name: currentProject.name },
        )
      : undefined;

  let body: React.ReactNode = null;

  if (!isValidId) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'pageAction.detail.invalidId' })}
        description={intl.formatMessage({ id: 'pageAction.detail.notFoundDesc' })}
        action={
          <button
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold"
            onClick={handleBack}
          >
            {intl.formatMessage({ id: 'common.backToList' })}
          </button>
        }
      />
    );
  } else if (!projectId) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'pageAction.empty.noProject.title' })}
        description={intl.formatMessage({
          id: 'pageAction.empty.noProject.desc',
        })}
        action={
          <button
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold"
            onClick={handleBack}
          >
            {intl.formatMessage({ id: 'common.backToList' })}
          </button>
        }
      />
    );
  } else if (!loading && !record) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'pageAction.detail.notFound' })}
        description={intl.formatMessage({ id: 'pageAction.detail.notFoundDesc' })}
        action={
          <button
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold"
            onClick={handleBack}
          >
            {intl.formatMessage({ id: 'common.backToList' })}
          </button>
        }
      />
    );
  } else if (record) {
    body = (
      <PageActionForm
        form={form}
        mode="edit"
        editingActionKey={record.actionKey}
        projectId={projectId}
        workflowBinding={workflowBinding}
        onWorkflowBindingChange={setWorkflowBinding}
        onPushHostToolResolved={handlePushHostToolResolved}
        hostToolIdLocked={hostToolIdLocked}
        hostTools={hostTools}
        hostToolsLoading={hostToolsLoading}
        onHostToolChange={handleHostToolChange}
        onFinish={(values) => void handleSubmit(values)}
      />
    );
  }

  return (
    <AppDetailPage
      pageClassName={styles.pageActionPage}
      bodyClassName={styles.formPage}
      loading={loading}
      onBack={handleBack}
      onSave={() => form.submit()}
      saveDisabled={!projectId || !record || submitting}
      saveLoading={submitting}
      saveLabel={intl.formatMessage({ id: 'common.save' })}
      title={intl.formatMessage({ id: 'pageAction.form.editTitle' })}
      subtitle={subtitle}
    >
      {body}
    </AppDetailPage>
  );
};

export default PageActionEditPage;
