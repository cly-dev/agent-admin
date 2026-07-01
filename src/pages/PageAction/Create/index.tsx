import { AppDetailPage } from '@/components/AppDetailHeader';
import ContentEmpty from '@/components/ContentEmpty';
import { useIntl } from '@umijs/max';
import PageActionForm from '../components/PageActionForm';
import styles from '../index.module.scss';
import { usePageActionCreate } from '../usePageActionCreate';

const PageActionCreatePage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    currentProject,
    form,
    hostTools,
    hostToolsLoading,
    submitting,
    workflowBinding,
    setWorkflowBinding,
    hostToolIdLocked,
    handlePushHostToolResolved,
    handleBack,
    handleActionKeyBlur,
    handleHostToolChange,
    handleSubmit,
  } = usePageActionCreate();

  const subtitle = currentProject?.name
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

  return (
    <AppDetailPage
      pageClassName={styles.pageActionPage}
      bodyClassName={styles.formPage}
      onBack={handleBack}
      onSave={() => form.submit()}
      saveDisabled={!projectId || submitting}
      saveLoading={submitting}
      saveLabel={intl.formatMessage({ id: 'pageAction.form.createSubmit' })}
      title={intl.formatMessage({ id: 'pageAction.form.createTitle' })}
      subtitle={subtitle}
    >
      {!projectId ? (
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
      ) : (
        <PageActionForm
          form={form}
          mode="create"
          projectId={projectId}
          workflowBinding={workflowBinding}
          onWorkflowBindingChange={setWorkflowBinding}
          onPushHostToolResolved={handlePushHostToolResolved}
          hostToolIdLocked={hostToolIdLocked}
          hostTools={hostTools}
          hostToolsLoading={hostToolsLoading}
          onHostToolChange={handleHostToolChange}
          onActionKeyBlur={handleActionKeyBlur}
          onFinish={(values) => void handleSubmit(values)}
        />
      )}
    </AppDetailPage>
  );
};

export default PageActionCreatePage;
