import { AppDetailPage } from '@/components/AppDetailHeader';
import ContentEmpty from '@/components/ContentEmpty';
import { useIntl } from '@umijs/max';
import PageActionForm from '../components/PageActionForm';
import styles from '../index.module.scss';
import { usePageActionForm } from '../usePageActionForm';

const PageActionFormPage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    currentProject,
    isCreateMode,
    isValidId,
    record,
    loading,
    form,
    hostTools,
    hostToolsLoading,
    submitting,
    flowBinding,
    setFlowBinding,
    legacyWorkflowId,
    configMode,
    handleConfigModeChange,
    workflowPushState,
    handlePushHostToolResolved,
    handleBack,
    handleActionKeyBlur,
    handleHostToolChange,
    handleSubmit,
  } = usePageActionForm();

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
      : projectId
        ? intl.formatMessage(
            { id: 'pageAction.detail.createSubtitleFallback' },
            { appClientId: projectId },
          )
        : undefined;

  let body: React.ReactNode = null;

  if (!isCreateMode && !isValidId) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'pageAction.detail.invalidId' })}
        description={intl.formatMessage({
          id: 'pageAction.detail.notFoundDesc',
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
  } else if (!isCreateMode && !loading && !record) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'pageAction.detail.notFound' })}
        description={intl.formatMessage({
          id: 'pageAction.detail.notFoundDesc',
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
  } else if (isCreateMode || record) {
    body = (
      <PageActionForm
        form={form}
        mode={isCreateMode ? 'create' : 'edit'}
        editingActionKey={record?.actionKey}
        projectId={projectId}
        configMode={configMode}
        onConfigModeChange={handleConfigModeChange}
        flowBinding={flowBinding}
        legacyWorkflowId={legacyWorkflowId}
        onFlowBindingChange={setFlowBinding}
        onPushHostToolResolved={handlePushHostToolResolved}
        workflowPushState={workflowPushState}
        hostTools={hostTools}
        hostToolsLoading={hostToolsLoading}
        onHostToolChange={handleHostToolChange}
        onActionKeyBlur={isCreateMode ? handleActionKeyBlur : undefined}
        onFinish={(values) => void handleSubmit(values)}
      />
    );
  }

  return (
    <AppDetailPage
      pageClassName={styles.pageActionPage}
      bodyClassName={styles.formPage}
      loading={!isCreateMode && loading}
      onBack={handleBack}
      onSave={() => form.submit()}
      saveDisabled={!projectId || submitting || (!isCreateMode && !record)}
      saveLoading={submitting}
      saveLabel={
        isCreateMode
          ? intl.formatMessage({ id: 'pageAction.form.createSubmit' })
          : intl.formatMessage({ id: 'common.save' })
      }
      title={
        isCreateMode
          ? intl.formatMessage({ id: 'pageAction.form.createTitle' })
          : intl.formatMessage({ id: 'pageAction.form.editTitle' })
      }
      subtitle={subtitle}
    >
      {body}
    </AppDetailPage>
  );
};

export default PageActionFormPage;
