import { AppDetailPage } from '@/components/AppDetailHeader';
import ContentEmpty from '@/components/ContentEmpty';
import { PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form, Input, Switch } from 'antd';
import { getAgentListStatus } from '../agentShared';
import AgentAllowedHostToolsTable from '../components/AgentAllowedHostToolsTable';
import AgentAllowedToolsTable from '../components/AgentAllowedToolsTable';
import AgentBindHostToolsModal from '../components/AgentBindHostToolsModal';
import AgentBindToolsModal from '../components/AgentBindToolsModal';
import styles from '../index.module.scss';
import type { AgentFormValues } from '../useAgentDetail';
import { useAgentDetail } from '../useAgentDetail';
import { useAgentHostTools } from '../useAgentHostTools';

const { TextArea } = Input;

const AgentDetailPage: React.FC = () => {
  const intl = useIntl();
  const {
    form,
    agent,
    loading,
    submitting,
    toolsFilterForm,
    appliedToolsFilters,
    toolsLoading,
    boundTools,
    toolsPage,
    toolsPageSize,
    toolsTotal,
    boundToolIds,
    projectId,
    isCreateMode,
    bindModalOpen,
    bindModalLoading,
    bindSubmitting,
    unbindSubmittingId,
    availableTools,
    bindModalPage,
    bindModalPageSize,
    bindModalTotal,
    bindModalKeyword,
    setBindModalKeyword,
    onBindModalPageChange,
    openBindModal,
    onBindModalOpenChange,
    handleBindTools,
    handleUnbindTool,
    onBoundToolsPageChange,
    handleToolsFilterSearch,
    handleToolsFilterReset,
    handleDiscard,
    handleSubmit,
  } = useAgentDetail();

  const hostToolsEnabled =
    !isCreateMode && Boolean(agent?.id) && Boolean(projectId);
  const hostTools = useAgentHostTools({
    agentId: agent?.id ?? 0,
    projectId: projectId ?? 0,
    enabled: hostToolsEnabled,
    seedHostTools: agent?.hostTools,
  });

  const watchedName = Form.useWatch('name', form);

  const pageTitle = isCreateMode
    ? intl.formatMessage({ id: 'agent.detail.createTitle' })
    : (agent?.name ??
      watchedName?.trim() ??
      intl.formatMessage({ id: 'agent.detail.title' }));

  const status = agent ? getAgentListStatus(agent) : null;
  const statusLabelId =
    status === 'inactive' ? 'agent.status.inactive' : 'agent.status.active';

  return (
    <>
      <AppDetailPage
        pageClassName={styles.agentPage}
        loading={loading}
        onBack={handleDiscard}
        onSave={() => form.submit()}
        saveDisabled={(!isCreateMode && !agent) || submitting || !projectId}
        saveLoading={submitting}
        saveLabel={intl.formatMessage({
          id: isCreateMode ? 'agent.detail.create' : 'common.save',
        })}
      >
        {!isCreateMode && !agent && !loading ? (
          <div className={styles.agentDetailEmpty}>
            <ContentEmpty
              title={intl.formatMessage({ id: 'agent.detail.notFound' })}
              description={intl.formatMessage({
                id: 'agent.detail.notFoundDesc',
              })}
              action={
                <button
                  type="button"
                  className="app-button-secondary px-4 py-2 text-sm font-semibold"
                  onClick={handleDiscard}
                >
                  {intl.formatMessage({ id: 'agent.detail.back' })}
                </button>
              }
            />
          </div>
        ) : (
          <div className={styles.agentDetailContent}>
            <Form<AgentFormValues>
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={handleSubmit}
            >
              <section className={styles.agentDetailBasic}>
                <div className={styles.agentDetailIntro}>
                  <div className={styles.agentDetailTitleRow}>
                    <h1 className={styles.agentDetailTitle}>{pageTitle}</h1>
                    {status ? (
                      <span
                        className={`${styles.agentDetailStatusBadge} ${
                          status === 'active'
                            ? styles.agentStatusActive
                            : styles.agentStatusInactive
                        }`}
                      >
                        {intl.formatMessage({ id: statusLabelId })}
                      </span>
                    ) : null}
                  </div>
                  {isCreateMode ? (
                    <p className={styles.agentDetailSubtitle}>
                      {intl.formatMessage({
                        id: 'agent.detail.createSubtitle',
                      })}
                    </p>
                  ) : agent ? (
                    <p className={styles.agentDetailSubtitle}>ID: {agent.id}</p>
                  ) : null}
                </div>

                <div className={styles.agentDetailFormGrid}>
                  <Form.Item
                    name="name"
                    label={intl.formatMessage({ id: 'agent.form.name' })}
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({
                          id: 'agent.form.nameRequired',
                        }),
                      },
                    ]}
                  >
                    <Input className="app-input" />
                  </Form.Item>

                  <Form.Item
                    name="maxSteps"
                    label={intl.formatMessage({ id: 'agent.form.maxSteps' })}
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({
                          id: 'agent.form.maxStepsRequired',
                        }),
                      },
                    ]}
                  >
                    <Input type="number" min={1} className="app-input" />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    className={styles.agentDetailFieldFull}
                    label={intl.formatMessage({ id: 'agent.form.description' })}
                  >
                    <TextArea rows={2} className="app-input" />
                  </Form.Item>

                  <Form.Item
                    name="enableToolCall"
                    className={styles.agentDetailFieldFull}
                    label={intl.formatMessage({
                      id: 'agent.form.enableToolCall',
                    })}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item
                    name="systemPrompt"
                    className={styles.agentDetailFieldFull}
                    label={intl.formatMessage({
                      id: 'agent.form.systemPrompt',
                    })}
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({
                          id: 'agent.form.systemPromptRequired',
                        }),
                      },
                    ]}
                  >
                    <TextArea
                      rows={10}
                      className="app-input font-mono text-[13px]"
                      placeholder={intl.formatMessage({
                        id: 'agent.form.systemPromptPlaceholder',
                      })}
                    />
                  </Form.Item>
                </div>
              </section>
            </Form>

            <section className={styles.agentDetailToolsSection}>
              <div className={styles.agentDetailToolsHeader}>
                <h2 className={styles.agentDetailSectionTitle}>
                  {intl.formatMessage({ id: 'agent.tools.title' })}
                  <span className={styles.agentDetailToolsCount}>
                    {toolsTotal}
                  </span>
                </h2>
                <button
                  type="button"
                  className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={submitting || !projectId}
                  onClick={openBindModal}
                >
                  <PlusOutlined />
                  {intl.formatMessage({ id: 'agent.tools.bind' })}
                </button>
              </div>
              <AgentAllowedToolsTable
                tools={boundTools}
                loading={toolsLoading}
                page={toolsPage}
                pageSize={toolsPageSize}
                total={toolsTotal}
                unbindSubmittingId={unbindSubmittingId}
                onPageChange={isCreateMode ? undefined : onBoundToolsPageChange}
                onUnbind={handleUnbindTool}
                filter={
                  isCreateMode
                    ? undefined
                    : {
                        form: toolsFilterForm,
                        appliedFilters: appliedToolsFilters,
                        loading: toolsLoading,
                        onSearch: handleToolsFilterSearch,
                        onReset: handleToolsFilterReset,
                      }
                }
              />
            </section>

            {!isCreateMode ? (
              <section className={styles.agentDetailToolsSection}>
                <div className={styles.agentDetailToolsHeader}>
                  <h2 className={styles.agentDetailSectionTitle}>
                    {intl.formatMessage({ id: 'agent.hostTools.title' })}
                    <span className={styles.agentDetailToolsCount}>
                      {hostTools.total}
                    </span>
                  </h2>
                  <button
                    type="button"
                    className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={submitting || !hostToolsEnabled}
                    onClick={hostTools.openBindModal}
                  >
                    <PlusOutlined />
                    {intl.formatMessage({ id: 'agent.hostTools.bind' })}
                  </button>
                </div>
                <AgentAllowedHostToolsTable
                  tools={hostTools.boundTools}
                  loading={hostTools.loading}
                  page={hostTools.page}
                  pageSize={hostTools.pageSize}
                  total={hostTools.total}
                  unbindSubmittingId={hostTools.unbindSubmittingId}
                  onUnbind={(hostToolId) =>
                    void hostTools.handleUnbindTool(hostToolId)
                  }
                />
              </section>
            ) : null}
          </div>
        )}
      </AppDetailPage>

      <AgentBindToolsModal
        open={bindModalOpen}
        loading={bindModalLoading}
        submitting={bindSubmitting}
        tools={availableTools}
        boundToolIds={boundToolIds}
        page={bindModalPage}
        pageSize={bindModalPageSize}
        total={bindModalTotal}
        keyword={bindModalKeyword}
        onKeywordChange={setBindModalKeyword}
        onPageChange={onBindModalPageChange}
        onOpenChange={onBindModalOpenChange}
        onSubmit={(toolIds) => void handleBindTools(toolIds)}
      />

      <AgentBindHostToolsModal
        open={hostTools.bindModalOpen}
        loading={hostTools.bindModalLoading}
        submitting={hostTools.bindSubmitting}
        tools={hostTools.availableTools}
        boundHostToolIds={hostTools.boundHostToolIds}
        page={hostTools.bindModalPage}
        pageSize={hostTools.bindModalPageSize}
        total={hostTools.bindModalTotal}
        keyword={hostTools.bindModalKeyword}
        onKeywordChange={hostTools.setBindModalKeyword}
        onPageChange={hostTools.onBindModalPageChange}
        onOpenChange={hostTools.onBindModalOpenChange}
        onSubmit={(hostToolIds) => void hostTools.handleBindTools(hostToolIds)}
      />
    </>
  );
};

export default AgentDetailPage;
