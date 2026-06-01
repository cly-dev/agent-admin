import ContentEmpty from '@/components/ContentEmpty';
import { getAgentListStatus } from '../agentShared';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Form, Input, Spin, Switch } from 'antd';
import AgentAllowedToolsTable from '../components/AgentAllowedToolsTable';
import AgentBoundToolsFilter from '../components/AgentBoundToolsFilter';
import AgentBindToolsModal from '../components/AgentBindToolsModal';
import { PlusOutlined } from '@ant-design/icons';
import type { AgentFormValues } from '../useAgentDetail';
import { useAgentDetail } from '../useAgentDetail';
import styles from '../index.module.scss';

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

  const watchedName = Form.useWatch('name', form);

  const pageTitle = isCreateMode
    ? intl.formatMessage({ id: 'agent.detail.createTitle' })
    : agent?.name ?? watchedName?.trim() ?? intl.formatMessage({ id: 'agent.detail.title' });

  const status = agent ? getAgentListStatus(agent) : null;
  const statusLabelId =
    status === 'inactive' ? 'agent.status.inactive' : 'agent.status.active';

  return (
    <PageContainer ghost className={styles.agentPage}>
      <div className={styles.agentPageShell}>
        <div className={styles.agentDetailCard}>
          <Spin spinning={loading}>
            <header className={styles.agentDetailTopBar}>
              <button
                type="button"
                className={styles.agentDetailBack}
                onClick={handleDiscard}
              >
                <ArrowLeftOutlined />
                {intl.formatMessage({ id: 'agent.detail.back' })}
              </button>
              <div className={styles.agentDetailTopBarActions}>
                <button
                  type="button"
                  className="app-button-tertiary px-4 py-2 text-sm font-semibold"
                  disabled={submitting}
                  onClick={handleDiscard}
                >
                  {intl.formatMessage({ id: 'common.discard' })}
                </button>
                <button
                  type="button"
                  className="app-button-primary inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={(!isCreateMode && !agent) || submitting || !projectId}
                  onClick={() => form.submit()}
                >
                  <SaveOutlined />
                  {intl.formatMessage({
                    id: isCreateMode ? 'agent.detail.create' : 'agent.detail.save',
                  })}
                </button>
              </div>
            </header>

            {!isCreateMode && !agent && !loading ? (
              <div className={styles.agentDetailEmpty}>
                <ContentEmpty
                  title={intl.formatMessage({ id: 'agent.detail.notFound' })}
                  description={intl.formatMessage({ id: 'agent.detail.notFoundDesc' })}
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
              <Form<AgentFormValues>
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={handleSubmit}
              >
                <div className={styles.agentDetailContent}>
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
                          {intl.formatMessage({ id: 'agent.detail.createSubtitle' })}
                        </p>
                      ) : agent ? (
                        <p className={styles.agentDetailSubtitle}>
                          ID: {agent.id}
                        </p>
                      ) : null}
                    </div>

                    <div className={styles.agentDetailFormGrid}>
                      <Form.Item
                        name="name"
                        label={intl.formatMessage({ id: 'agent.form.name' })}
                        rules={[
                          {
                            required: true,
                            message: intl.formatMessage({ id: 'agent.form.nameRequired' }),
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
                        label={intl.formatMessage({ id: 'agent.form.enableToolCall' })}
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item
                        name="systemPrompt"
                        className={styles.agentDetailFieldFull}
                        label={intl.formatMessage({ id: 'agent.form.systemPrompt' })}
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

                  <section className={styles.agentDetailToolsSection}>
                    <div className={styles.agentDetailToolsHeader}>
                      <h2 className={styles.agentDetailSectionTitle}>
                        {intl.formatMessage({ id: 'agent.tools.title' })}
                        <span className={styles.agentDetailToolsCount}>{toolsTotal}</span>
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
                    {!isCreateMode ? (
                      <AgentBoundToolsFilter
                        form={toolsFilterForm}
                        appliedFilters={appliedToolsFilters}
                        loading={toolsLoading}
                        onSearch={handleToolsFilterSearch}
                        onReset={handleToolsFilterReset}
                      />
                    ) : null}
                    <AgentAllowedToolsTable
                      tools={boundTools}
                      loading={toolsLoading}
                      page={toolsPage}
                      pageSize={toolsPageSize}
                      total={toolsTotal}
                      unbindSubmittingId={unbindSubmittingId}
                      onPageChange={isCreateMode ? undefined : onBoundToolsPageChange}
                      onUnbind={handleUnbindTool}
                    />
                  </section>
                </div>
              </Form>
            )}
          </Spin>
        </div>
      </div>

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
    </PageContainer>
  );
};

export default AgentDetailPage;
