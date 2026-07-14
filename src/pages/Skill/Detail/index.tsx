import { AppDetailPage } from '@/components/AppDetailHeader';
import ContentEmpty from '@/components/ContentEmpty';
import { ApartmentOutlined, FileTextOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert, Collapse, Form, Input, Select, Switch } from 'antd';
import type { ReactNode } from 'react';
import SkillConfigModePicker from '../components/SkillConfigModePicker';
import SkillExecutionConfigPanel from '../components/SkillExecutionConfigPanel';
import styles from '../index.module.scss';
import type { SkillFormValues } from '../useSkillDetail';
import { useSkillDetail } from '../useSkillDetail';

const RISK_LEVEL_OPTIONS = ['L1', 'L2', 'L3'] as const;

function FormPanel({
  icon,
  iconAccent,
  title,
  hint,
  children,
  className,
}: {
  icon: ReactNode;
  iconAccent?: boolean;
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${styles.formPanel} ${className ?? ''}`.trim()}>
      <header className={styles.formPanelHeader}>
        <span
          className={`${styles.formPanelIcon} ${iconAccent ? styles.formPanelIconAccent : ''}`.trim()}
        >
          {icon}
        </span>
        <div>
          <h2 className={styles.formPanelTitle}>{title}</h2>
          {hint ? <p className={styles.formPanelHint}>{hint}</p> : null}
        </div>
      </header>
      <div className={styles.formPanelBody}>{children}</div>
    </section>
  );
}

const SkillDetailPage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    appClientDisplayName,
    form,
    skill,
    loading,
    saving,
    isValidRoute,
    isCreateMode,
    agentsLoading,
    agentOptions,
    appToolsLoading,
    hostToolsLoading,
    toolRows,
    mutationHostToolRows,
    planHostToolRows,
    selectedToolIds,
    selectedHostToolIds,
    promptToolOptions,
    promptHostToolOptions,
    resolvedAppClientId,
    workflowBinding,
    hasLegacyWorkflow,
    executionMode,
    useRawConfigOnly,
    showForm,
    handleBack,
    handleSave,
    handlePromptChange,
    handleExecutionModeChange,
    handleToolSelectionChange,
    handleWorkflowBindingChange,
    handleConfigJsonChange,
    toggleToolRequired,
    handleHostToolTabRowChange,
  } = useSkillDetail();

  const promptValue = Form.useWatch('prompt', form) ?? '';
  const configJsonValue = Form.useWatch('configJson', form) ?? '';
  const isPromptMode = executionMode === 'prompt';

  const pageTitle = isCreateMode
    ? intl.formatMessage({ id: 'skill.detail.createTitle' })
    : skill?.name
      ? intl.formatMessage(
          { id: 'skill.detail.titleWithName' },
          { name: skill.name },
        )
      : intl.formatMessage({ id: 'skill.detail.title' });

  const subtitle = isCreateMode
    ? appClientDisplayName
      ? intl.formatMessage(
          { id: 'skill.detail.createSubtitle' },
          { name: appClientDisplayName },
        )
      : projectId
        ? intl.formatMessage(
            { id: 'skill.detail.createSubtitleFallback' },
            { appClientId: projectId },
          )
        : undefined
    : skill
      ? intl.formatMessage(
          { id: 'skill.detail.subtitle' },
          {
            id: skill.id,
            app:
              skill.appClientName?.trim() ||
              skill.appClient?.name?.trim() ||
              `#${skill.appClientId}`,
          },
        )
      : undefined;

  const saveLabel = intl.formatMessage({
    id: isCreateMode ? 'skill.detail.create' : 'skill.detail.save',
  });

  const editorDisabled =
    !resolvedAppClientId || appToolsLoading || hostToolsLoading;

  const basicsCollapseItems = [
    {
      key: 'basics',
      // Keep Form.Item mounted while collapsed so fields stay registered for save.
      forceRender: true,
      label: intl.formatMessage({ id: 'skill.detail.basicInfo' }),
      children: (
        <div className={styles.skillDetailBasicsBody}>
          {skill?.requiresWriteConfirmation ? (
            <Alert
              type="warning"
              showIcon
              className={styles.skillDetailAlert}
              message={intl.formatMessage({
                id: 'skill.detail.requiresWriteConfirmation',
              })}
            />
          ) : null}
          <div className={styles.skillDetailFormGrid}>
            <Form.Item
              label={intl.formatMessage({ id: 'skill.form.appClient' })}
            >
              <Input
                className="app-input"
                disabled
                value={
                  appClientDisplayName
                    ? appClientDisplayName
                    : projectId
                      ? `#${projectId}`
                      : '—'
                }
              />
            </Form.Item>
            {isCreateMode ? (
              <Form.Item
                name="agentId"
                label={intl.formatMessage({ id: 'skill.form.agentOptional' })}
                extra={intl.formatMessage({
                  id: 'skill.form.agentOptionalHint',
                })}
              >
                <Select
                  allowClear
                  className="app-input"
                  showSearch
                  loading={agentsLoading}
                  disabled={agentsLoading || agentOptions.length === 0}
                  placeholder={intl.formatMessage({
                    id: 'skill.form.agentOptionalPlaceholder',
                  })}
                  options={agentOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            ) : null}
          </div>
          <div className={styles.skillDetailFormGrid}>
            <Form.Item
              name="name"
              label={intl.formatMessage({ id: 'skill.column.name' })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'skill.form.nameRequired',
                  }),
                },
              ]}
            >
              <Input
                className="app-input"
                placeholder={intl.formatMessage({
                  id: 'skill.form.namePlaceholder',
                })}
                maxLength={128}
              />
            </Form.Item>
            <Form.Item
              name="capabilityKey"
              label={intl.formatMessage({ id: 'skill.column.capabilityKey' })}
            >
              <Input
                className="app-input"
                placeholder={intl.formatMessage({
                  id: 'skill.form.capabilityKeyPlaceholder',
                })}
              />
            </Form.Item>
          </div>
          <div className={styles.skillDetailFormGrid}>
            <Form.Item
              name="riskLevel"
              label={intl.formatMessage({ id: 'skill.form.riskLevel' })}
            >
              <Select
                allowClear
                className="app-input"
                placeholder={intl.formatMessage({
                  id: 'skill.form.riskLevelPlaceholder',
                })}
                options={RISK_LEVEL_OPTIONS.map((value) => ({
                  value,
                  label: intl.formatMessage({
                    id: `skill.form.riskLevel.${value}`,
                  }),
                }))}
              />
            </Form.Item>
            <Form.Item
              name="isActive"
              label={intl.formatMessage({ id: 'skill.column.isActive' })}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
          <Form.Item
            name="description"
            label={intl.formatMessage({ id: 'skill.column.description' })}
          >
            <Input.TextArea
              className="app-input"
              autoSize={{ minRows: 2, maxRows: 4 }}
              placeholder={intl.formatMessage({
                id: 'skill.form.descriptionPlaceholder',
              })}
            />
          </Form.Item>
        </div>
      ),
    },
  ];

  const advancedCollapseItems = [
    {
      key: 'config',
      forceRender: true,
      label: intl.formatMessage({ id: 'skill.detail.tab.config' }),
      children: (
        <div className={styles.skillDetailAdvancedBody}>
          <p className={styles.skillDetailSectionHint}>
            {intl.formatMessage({ id: 'skill.detail.configAdvancedHint' })}
          </p>
          <Form.Item
            name="configJson"
            label={intl.formatMessage({ id: 'skill.form.config' })}
            extra={intl.formatMessage({ id: 'skill.form.configHint' })}
          >
            <Input.TextArea
              className="app-input font-mono text-xs"
              autoSize={{ minRows: 8, maxRows: 20 }}
              value={configJsonValue}
              onChange={(event) => handleConfigJsonChange(event.target.value)}
            />
          </Form.Item>
        </div>
      ),
    },
  ];

  let body: React.ReactNode = null;

  if (!isValidRoute) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'skill.detail.invalidRoute' })}
        description={intl.formatMessage({ id: 'skill.detail.notFoundDesc' })}
        action={
          <button
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold"
            onClick={handleBack}
          >
            {intl.formatMessage({ id: 'skill.detail.back' })}
          </button>
        }
      />
    );
  } else if (!projectId) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'skill.empty.noProject.title' })}
        description={intl.formatMessage({ id: 'skill.empty.noProject.desc' })}
        action={
          <button
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold"
            onClick={handleBack}
          >
            {intl.formatMessage({ id: 'skill.detail.back' })}
          </button>
        }
      />
    );
  } else if (!isCreateMode && !loading && !skill) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'skill.detail.notFound' })}
        description={intl.formatMessage({ id: 'skill.detail.notFoundDesc' })}
        action={
          <button
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold"
            onClick={handleBack}
          >
            {intl.formatMessage({ id: 'skill.detail.back' })}
          </button>
        }
      />
    );
  } else if (showForm) {
    body = (
      <div className={styles.skillDetailBody}>
        <Form<SkillFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          className={styles.skillFormLayout}
        >
          <section className={styles.skillDetailBasics}>
            <Collapse
              bordered={false}
              defaultActiveKey={isCreateMode ? ['basics'] : []}
              items={basicsCollapseItems}
            />
          </section>

          <SkillConfigModePicker
            value={executionMode}
            onChange={handleExecutionModeChange}
          />

          {isPromptMode ? (
            <FormPanel
              icon={<FileTextOutlined />}
              iconAccent
              title={intl.formatMessage({
                id: 'skill.form.configMode.prompt.panelTitle',
              })}
              hint={intl.formatMessage({
                id: 'skill.form.configMode.prompt.panelHint',
              })}
              className={styles.formPanelPrompt}
            >
              <SkillExecutionConfigPanel
                mode="prompt"
                promptValue={promptValue}
                onPromptChange={handlePromptChange}
                promptToolOptions={promptToolOptions}
                promptHostToolOptions={promptHostToolOptions}
                boundToolIds={selectedToolIds}
                boundHostToolIds={selectedHostToolIds}
                toolRows={toolRows}
                selectedToolIds={selectedToolIds}
                mutationHostToolRows={mutationHostToolRows}
                planHostToolRows={planHostToolRows}
                saving={saving}
                promptDisabled={editorDisabled}
                onToolSelectionChange={handleToolSelectionChange}
                onToolRequiredChange={toggleToolRequired}
                onHostToolRowChange={handleHostToolTabRowChange}
              />
            </FormPanel>
          ) : (
            <FormPanel
              icon={<ApartmentOutlined />}
              title={intl.formatMessage({
                id: 'skill.form.configMode.workflow.panelTitle',
              })}
              hint={intl.formatMessage({
                id: 'skill.form.configMode.workflow.panelHint',
              })}
            >
              <SkillExecutionConfigPanel
                projectId={projectId}
                mode="workflow"
                promptValue={promptValue}
                onPromptChange={handlePromptChange}
                workflowBinding={workflowBinding}
                hasLegacyWorkflow={hasLegacyWorkflow}
                useRawConfigOnly={useRawConfigOnly}
                saving={saving}
                promptDisabled={editorDisabled}
                onWorkflowBindingChange={handleWorkflowBindingChange}
              />
            </FormPanel>
          )}

          <section className={styles.skillDetailAdvanced}>
            <Collapse bordered={false} items={advancedCollapseItems} />
          </section>
        </Form>
      </div>
    );
  }

  return (
    <AppDetailPage
      pageClassName={styles.skillPage}
      title={pageTitle}
      subtitle={subtitle}
      loading={loading}
      backLabel={intl.formatMessage({ id: 'skill.detail.back' })}
      saveLabel={saveLabel}
      onBack={handleBack}
      onSave={showForm ? () => void handleSave() : undefined}
      saveDisabled={saving || !projectId}
      saveLoading={saving}
    >
      {body}
    </AppDetailPage>
  );
};

export default SkillDetailPage;
