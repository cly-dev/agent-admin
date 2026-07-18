import { ApiTestPanel } from '@/components/ApiTestPanel';
import { AppDetailPage } from '@/components/AppDetailHeader';
import type { ToolHttpMethod, ToolStatus } from '@/types/tool';
import {
  ApiOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { FormattedMessage, Link, useIntl } from '@umijs/max';
import { Alert, Form, Input, InputNumber, Select, Steps, Switch } from 'antd';
import { useMemo, useState } from 'react';
import ToolAgentMetadataEditor from '../components/ToolAgentMetadataEditor';
import ToolInitSchemasPreviewModal from '../components/ToolInitSchemasPreviewModal';
import ToolParametersEditor from '../components/ToolParametersEditor';
import ToolResponseEditors from '../components/ToolResponseEditors';
import styles from '../index.module.scss';
import {
  deriveDecisionRoleFromAgentMetadata,
  normalizeAgentMetadata,
} from '../toolAgentMetadata';
import type { ToolFormValues } from '../useTools';
import { formatIntegrationHost, getToolStatus } from '../useTools';
import { useToolDetail } from './useToolDetail';

const { TextArea } = Input;

const STATUS_BADGE_CLASS: Record<ToolStatus, string> = {
  active: styles.toolDetailStatusActive,
  inactive: styles.toolDetailStatusInactive,
  config_required: styles.toolDetailStatusWarning,
};

const METHOD_BADGE_CLASS: Record<ToolHttpMethod, string> = {
  Get: styles.toolDetailMethodGet,
  Post: styles.toolDetailMethodPost,
  Put: styles.toolDetailMethodPut,
  Delete: styles.toolDetailMethodDelete,
};

const ToolDetailPage: React.FC = () => {
  const intl = useIntl();
  const {
    form,
    tool,
    loading,
    submitting,
    testing,
    generatingSchemas,
    testResult,
    testParams,
    setTestParams,
    testApiKey,
    setTestApiKey,
    schemaHint,
    setSchemaHint,
    outputSchemaFields,
    handleOutputSchemaFieldsChange,
    handleFormValuesChange,
    watchedMethod,
    watchedPath,
    watchedIsActive,
    watchedIntegrationId,
    selectedIntegration,
    isCreateMode,
    projectId,
    integrationOptions,
    httpMethods,
    riskLevels,
    handleDiscard,
    handleSubmit,
    handleRunTest,
    handleGenerateResponseSchemas,
    initSchemasPreview,
    initSchemasPreviewOpen,
    setInitSchemasPreviewOpen,
    handleApplyInitSchemasPreview,
    handleApplyAndPersistInitSchemas,
    fillTestParamsFromParameters,
  } = useToolDetail();

  const [wizardStep, setWizardStep] = useState(0);

  const pageTitle = isCreateMode
    ? intl.formatMessage({ id: 'tool.detail.createTitle' })
    : (tool?.name ?? intl.formatMessage({ id: 'tool.detail.title' }));

  const pageSubtitle = isCreateMode ? (
    <FormattedMessage
      id="tool.detail.createSubtitle"
      values={{
        integrationLink: (
          <Link to="/tool/integration" className={styles.toolDetailInlineLink}>
            {intl.formatMessage({ id: 'tool.integrationLink' })}
          </Link>
        ),
      }}
    />
  ) : (
    intl.formatMessage({ id: 'tool.detail.subtitle' })
  );

  const displayMethod = (watchedMethod ??
    tool?.method ??
    'Get') as ToolHttpMethod;
  const displayPath = (watchedPath ?? tool?.path ?? '').trim();
  const integrationBaseUrl =
    selectedIntegration && 'baseUrl' in selectedIntegration
      ? selectedIntegration.baseUrl
      : tool?.integration?.baseUrl;

  const integrationPreviewLabel = useMemo(() => {
    if (integrationBaseUrl) {
      return formatIntegrationHost(integrationBaseUrl);
    }
    const name =
      selectedIntegration && 'name' in selectedIntegration
        ? selectedIntegration.name
        : tool?.integration?.name;
    return name?.trim() || '—';
  }, [integrationBaseUrl, selectedIntegration, tool?.integration?.name]);

  const pathPreviewLabel = displayPath
    ? displayPath.startsWith('/')
      ? displayPath
      : `/${displayPath}`
    : intl.formatMessage({ id: 'tool.detail.endpointPreviewPathEmpty' });

  const statusPreview = useMemo(() => {
    if (!tool) {
      return null;
    }
    return getToolStatus({
      ...tool,
      method: displayMethod,
      path: displayPath,
      integrationId: watchedIntegrationId ?? tool.integrationId,
      isActive: watchedIsActive ?? tool.isActive,
      integration:
        selectedIntegration && 'authMode' in selectedIntegration
          ? {
              id: selectedIntegration.id,
              name: selectedIntegration.name,
              baseUrl: selectedIntegration.baseUrl,
              authMode: selectedIntegration.authMode,
              systemConfigured: selectedIntegration.systemConfigured,
            }
          : tool.integration,
    });
  }, [
    displayMethod,
    displayPath,
    selectedIntegration,
    tool,
    watchedIntegrationId,
    watchedIsActive,
  ]);

  const statusLabelId =
    statusPreview === 'active'
      ? 'tool.status.active'
      : statusPreview === 'config_required'
        ? 'tool.status.configRequired'
        : 'tool.status.inactive';

  const watchedAgentMetadata = Form.useWatch('agentMetadata', form);
  const agentMetadataPreview = useMemo(() => {
    const fromForm = normalizeAgentMetadata(watchedAgentMetadata);
    if (fromForm) {
      return fromForm;
    }
    return normalizeAgentMetadata(tool?.agentMetadata);
  }, [tool?.agentMetadata, watchedAgentMetadata]);

  const decisionRolePreview = useMemo(() => {
    if (agentMetadataPreview) {
      return deriveDecisionRoleFromAgentMetadata(agentMetadataPreview);
    }
    const profileRole = tool?.responseProfile?.decisionRole;
    return typeof profileRole === 'string' && profileRole.trim()
      ? profileRole
      : '—';
  }, [agentMetadataPreview, tool?.responseProfile?.decisionRole]);

  return (
    <AppDetailPage
      pageClassName={styles.toolPage}
      bodyClassName={styles.toolDetailPage}
      title={pageTitle}
      subtitle={pageSubtitle}
      loading={loading}
      onBack={handleDiscard}
      onSave={() => form.submit()}
      saveDisabled={!projectId || submitting}
      saveLoading={submitting}
    >
      <Form<ToolFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        preserve
        onFinish={handleSubmit}
        onValuesChange={handleFormValuesChange}
      >
        <div className={styles.toolDetailLayout}>
          <section className={styles.toolDetailSummary}>
            <div className={styles.toolDetailSummaryMain}>
              {!isCreateMode && statusPreview ? (
                <span
                  className={`${styles.toolDetailStatusBadge} ${STATUS_BADGE_CLASS[statusPreview]}`}
                >
                  {intl.formatMessage({ id: statusLabelId })}
                </span>
              ) : null}
              {!isCreateMode && tool ? (
                <span className={styles.toolDetailSummaryChip}>
                  ID {tool.id}
                </span>
              ) : null}
              <div className={styles.toolDetailEndpointPreviewLine}>
                <span
                  className={`${styles.toolDetailMethodBadge} ${METHOD_BADGE_CLASS[displayMethod]}`}
                >
                  {displayMethod.toUpperCase()}
                </span>
                <code className={styles.toolDetailEndpointPreviewSegment}>
                  {integrationPreviewLabel}
                </code>
                <code className={styles.toolDetailEndpointPreviewSegment}>
                  {pathPreviewLabel}
                </code>
              </div>
            </div>
          </section>

          <div className={styles.toolDetailGrid}>
            <div className={styles.toolDetailMainStack}>
              <div className={styles.toolDetailWizard}>
                <Steps
                  size="small"
                  current={wizardStep}
                  onChange={setWizardStep}
                  items={[
                    {
                      title: intl.formatMessage({
                        id: 'tool.wizard.step.call',
                      }),
                    },
                    {
                      title: intl.formatMessage({
                        id: 'tool.wizard.step.response',
                      }),
                      disabled: isCreateMode,
                    },
                    {
                      title: intl.formatMessage({
                        id: 'tool.wizard.step.agent',
                      }),
                    },
                  ]}
                />
              </div>

              {wizardStep === 0 ? (
                <>
              <section className={styles.toolDetailPanel}>
                <header className={styles.toolDetailPanelHeader}>
                  <span className={styles.toolDetailPanelIcon}>
                    <ApiOutlined />
                  </span>
                  <div>
                    <h2 className={styles.toolDetailPanelTitle}>
                      {intl.formatMessage({ id: 'tool.detail.apiConfig' })}
                    </h2>
                    <p className={styles.toolDetailPanelHint}>
                      {intl.formatMessage({
                        id: 'tool.detail.endpointPreview',
                      })}
                    </p>
                  </div>
                </header>

                <div className={styles.toolDetailEndpointEditor}>
                  <Form.Item
                    name="integrationId"
                    className={styles.toolDetailEndpointField}
                    label={
                      <span className={styles.toolDetailLabel}>
                        {intl.formatMessage({ id: 'tool.form.integration' })}
                      </span>
                    }
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({
                          id: 'tool.form.integrationRequired',
                        }),
                      },
                    ]}
                  >
                    <Select
                      className="app-input"
                      placeholder={intl.formatMessage({
                        id: 'tool.form.integrationPlaceholder',
                      })}
                      options={integrationOptions}
                      notFoundContent={intl.formatMessage({
                        id: 'tool.form.integrationEmpty',
                      })}
                    />
                  </Form.Item>

                  <div className={styles.toolDetailEndpointRow}>
                    <Form.Item
                      name="method"
                      className={styles.toolDetailEndpointMethod}
                      label={
                        <span className={styles.toolDetailLabel}>
                          {intl.formatMessage({ id: 'tool.form.method' })}
                        </span>
                      }
                    >
                      <Select
                        className={styles.toolDetailMethodSelect}
                        popupMatchSelectWidth
                        options={httpMethods.map((method) => ({
                          value: method,
                          label: method.toUpperCase(),
                        }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name="path"
                      className={styles.toolDetailEndpointPath}
                      label={
                        <span className={styles.toolDetailLabel}>
                          {intl.formatMessage({ id: 'tool.form.path' })}
                        </span>
                      }
                      rules={[
                        {
                          required: true,
                          message: intl.formatMessage({
                            id: 'tool.form.pathRequired',
                          }),
                        },
                      ]}
                    >
                      <Input
                        className="app-input font-mono"
                        placeholder={intl.formatMessage({
                          id: 'tool.form.pathPlaceholder',
                        })}
                      />
                    </Form.Item>
                  </div>
                </div>
              </section>

              <section className={styles.toolDetailPanel}>
                <header className={styles.toolDetailPanelHeader}>
                  <span className={styles.toolDetailPanelIcon}>
                    <InfoCircleOutlined />
                  </span>
                  <div>
                    <h2 className={styles.toolDetailPanelTitle}>
                      {intl.formatMessage({ id: 'tool.detail.basicInfo' })}
                    </h2>
                  </div>
                </header>

                <div className={styles.toolDetailFormGrid}>
                  <Form.Item
                    name="name"
                    className={styles.toolDetailField}
                    label={
                      <span className={styles.toolDetailLabel}>
                        {intl.formatMessage({ id: 'tool.form.name' })}
                      </span>
                    }
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({
                          id: 'tool.form.nameRequired',
                        }),
                      },
                    ]}
                  >
                    <Input
                      className="app-input"
                      placeholder={intl.formatMessage({
                        id: 'tool.form.namePlaceholder',
                      })}
                    />
                  </Form.Item>

                  <Form.Item
                    name="definitionKey"
                    className={styles.toolDetailField}
                    label={
                      <span className={styles.toolDetailLabel}>
                        {intl.formatMessage({ id: 'tool.form.definitionKey' })}
                      </span>
                    }
                    tooltip={intl.formatMessage({
                      id: 'tool.form.definitionKeyHint',
                    })}
                  >
                    <Input
                      className="app-input font-mono"
                      placeholder={intl.formatMessage({
                        id: 'tool.form.definitionKeyPlaceholder',
                      })}
                    />
                  </Form.Item>

                  <Form.Item
                    name="riskLevel"
                    className={styles.toolDetailField}
                    label={
                      <span className={styles.toolDetailLabel}>
                        {intl.formatMessage({ id: 'tool.form.riskLevel' })}
                      </span>
                    }
                  >
                    <Select
                      className="app-input"
                      options={riskLevels.map((level) => ({
                        value: level,
                        label: level,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item
                    name="timeout"
                    className={styles.toolDetailField}
                    label={
                      <span className={styles.toolDetailLabel}>
                        {intl.formatMessage({ id: 'tool.form.timeout' })}
                      </span>
                    }
                  >
                    <InputNumber
                      className="app-input w-full"
                      min={1000}
                      step={1000}
                      placeholder={intl.formatMessage({
                        id: 'tool.form.timeoutPlaceholder',
                      })}
                    />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    className={`${styles.toolDetailField} ${styles.toolDetailFieldFull}`}
                    label={
                      <span className={styles.toolDetailLabel}>
                        {intl.formatMessage({ id: 'tool.form.description' })}
                      </span>
                    }
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({
                          id: 'tool.form.descriptionRequired',
                        }),
                      },
                    ]}
                  >
                    <TextArea
                      rows={4}
                      className="app-input"
                      placeholder={intl.formatMessage({
                        id: 'tool.form.descriptionPlaceholder',
                      })}
                    />
                  </Form.Item>

                  <div
                    className={`${styles.toolDetailField} ${styles.toolDetailFieldFull}`}
                  >
                    <div className={styles.toolDetailActiveRow}>
                      <div>
                        <span className={styles.toolDetailLabel}>
                          {intl.formatMessage({ id: 'tool.form.isActive' })}
                        </span>
                        <p className={styles.toolDetailFieldHint}>
                          {intl.formatMessage({ id: 'tool.detail.activeHint' })}
                        </p>
                      </div>
                      <Form.Item
                        name="isActive"
                        valuePropName="checked"
                        noStyle
                      >
                        <Switch />
                      </Form.Item>
                    </div>
                  </div>
                </div>
              </section>

              <section className={styles.toolDetailPanel}>
                <header className={styles.toolDetailPanelHeader}>
                  <span className={styles.toolDetailPanelIcon}>
                    <ThunderboltOutlined />
                  </span>
                  <div>
                    <h2 className={styles.toolDetailPanelTitle}>
                      {intl.formatMessage({ id: 'tool.detail.parameters' })}
                    </h2>
                    <p className={styles.toolDetailPanelHint}>
                      {intl.formatMessage({ id: 'tool.detail.parametersDesc' })}
                    </p>
                  </div>
                </header>
                <Form.Item name="parameters" noStyle initialValue={[]}>
                  <ToolParametersEditor disabled={submitting} />
                </Form.Item>
              </section>
              <div className={styles.toolDetailWizardActions}>
                <button
                  type="button"
                  className="app-button-primary px-4 py-2 text-sm font-semibold"
                  onClick={() => setWizardStep(isCreateMode ? 2 : 1)}
                >
                  {intl.formatMessage({ id: 'tool.wizard.next' })}
                </button>
              </div>
                </>
              ) : null}

              {wizardStep === 1 && !isCreateMode ? (
                <section className={styles.toolDetailPanel}>
                  <header className={styles.toolDetailPanelHeader}>
                    <span className={styles.toolDetailPanelIcon}>
                      <ApiOutlined />
                    </span>
                    <div>
                      <h2 className={styles.toolDetailPanelTitle}>
                        {intl.formatMessage({
                          id: 'tool.detail.responseSection',
                        })}
                      </h2>
                      <p className={styles.toolDetailPanelHint}>
                        {intl.formatMessage({
                          id: 'tool.detail.responseSectionDesc',
                        })}
                      </p>
                    </div>
                  </header>

                  {!testResult?.ok ? (
                    <Alert
                      type="info"
                      showIcon
                      className={styles.toolDetailWizardEmpty}
                      message={intl.formatMessage({
                        id: 'tool.wizard.responseEmptyTitle',
                      })}
                      description={intl.formatMessage({
                        id: 'tool.wizard.responseEmptyDesc',
                      })}
                    />
                  ) : null}

                  <ToolResponseEditors
                    disabled={submitting}
                    outputSchemaFields={outputSchemaFields}
                    onOutputSchemaFieldsChange={handleOutputSchemaFieldsChange}
                  />

                  <div className={styles.toolDetailSchemaField}>
                    <span className={styles.toolDetailLabel}>
                      {intl.formatMessage({ id: 'tool.detail.schemaHint' })}
                    </span>
                    <p className={styles.toolDetailFieldHint}>
                      {intl.formatMessage({ id: 'tool.detail.schemaHintDesc' })}
                    </p>
                    <TextArea
                      rows={3}
                      className="app-input"
                      value={schemaHint}
                      placeholder={intl.formatMessage({
                        id: 'tool.detail.schemaHintPlaceholder',
                      })}
                      onChange={(event) => setSchemaHint(event.target.value)}
                    />
                  </div>
                  <div className={styles.toolDetailWizardActions}>
                    <button
                      type="button"
                      className="app-button-secondary px-4 py-2 text-sm font-semibold"
                      onClick={() => setWizardStep(0)}
                    >
                      {intl.formatMessage({ id: 'tool.wizard.prev' })}
                    </button>
                    <button
                      type="button"
                      className="app-button-primary px-4 py-2 text-sm font-semibold"
                      onClick={() => setWizardStep(2)}
                    >
                      {intl.formatMessage({ id: 'tool.wizard.next' })}
                    </button>
                  </div>
                </section>
              ) : null}

              {wizardStep === 2 ? (
                <section className={styles.toolDetailPanel}>
                <ToolAgentMetadataEditor
                  key={tool?.id ?? 'create'}
                  form={form}
                  disabled={submitting}
                  isCreateMode={isCreateMode}
                  savedAgentMetadata={tool?.agentMetadata ?? null}
                />
                  <div className={styles.toolDetailWizardActions}>
                    <button
                      type="button"
                      className="app-button-secondary px-4 py-2 text-sm font-semibold"
                      onClick={() => setWizardStep(isCreateMode ? 0 : 1)}
                    >
                      {intl.formatMessage({ id: 'tool.wizard.prev' })}
                    </button>
                  </div>
                </section>
              ) : null}
            </div>

            <aside className={styles.toolDetailAside}>
              <div className={styles.toolDetailAsideSticky}>
                <ApiTestPanel
                  title={intl.formatMessage({ id: 'tool.detail.testPanel' })}
                  params={testParams}
                  onParamsChange={setTestParams}
                  apiKey={testApiKey}
                  onApiKeyChange={setTestApiKey}
                  running={testing}
                  generatingSchemas={generatingSchemas}
                  paramsDisabled={isCreateMode}
                  runDisabled={isCreateMode}
                  generateSchemasDisabled={isCreateMode || !testResult?.ok}
                  result={testResult}
                  onRun={handleRunTest}
                  onGenerateSchemas={
                    testResult?.ok ? handleGenerateResponseSchemas : undefined
                  }
                  generateSchemasLabel={intl.formatMessage({
                    id: 'tool.initSchemas.cta',
                  })}
                  onSyncParams={fillTestParamsFromParameters}
                  syncParamsLabel={intl.formatMessage({
                    id: 'tool.detail.fillTestFromParams',
                  })}
                />

                {!isCreateMode && tool ? (
                  <section className={styles.toolDetailMetaCard}>
                    <h4 className={styles.toolDetailMetaTitle}>
                      {intl.formatMessage({ id: 'tool.detail.metaTitle' })}
                    </h4>
                    <dl className={styles.toolDetailMetaList}>
                      <div className={styles.toolDetailMetaItem}>
                        <dt>
                          {intl.formatMessage({ id: 'tool.detail.metaRisk' })}
                        </dt>
                        <dd>{tool.riskLevel}</dd>
                      </div>
                      <div className={styles.toolDetailMetaItem}>
                        <dt>
                          {intl.formatMessage({
                            id: 'tool.detail.metaIntegration',
                          })}
                        </dt>
                        <dd>
                          {selectedIntegration?.name ??
                            tool.integration?.name ??
                            '—'}
                        </dd>
                      </div>
                      <div className={styles.toolDetailMetaItem}>
                        <dt>
                          {intl.formatMessage({
                            id: 'tool.agentMetadata.decisionRole',
                          })}
                        </dt>
                        <dd>
                          <code className={styles.toolDetailMetaCode}>
                            {decisionRolePreview}
                          </code>
                        </dd>
                      </div>
                      {agentMetadataPreview ? (
                        <div className={styles.toolDetailMetaItem}>
                          <dt>
                            {intl.formatMessage({
                              id: 'tool.agentMetadata.mode',
                            })}
                          </dt>
                          <dd>
                            {agentMetadataPreview.mode} ·{' '}
                            {agentMetadataPreview.resource} ·{' '}
                            {agentMetadataPreview.operation}
                          </dd>
                        </div>
                      ) : (
                        <div className={styles.toolDetailMetaItem}>
                          <dt>
                            {intl.formatMessage({
                              id: 'tool.agentMetadata.sectionTitle',
                            })}
                          </dt>
                          <dd>
                            {intl.formatMessage({
                              id: 'tool.agentMetadata.notConfigured',
                            })}
                          </dd>
                        </div>
                      )}
                      {tool.updatedAt ? (
                        <div className={styles.toolDetailMetaItem}>
                          <dt>
                            {intl.formatMessage({
                              id: 'tool.detail.metaUpdated',
                            })}
                          </dt>
                          <dd>{new Date(tool.updatedAt).toLocaleString()}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </section>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </Form>

      <ToolInitSchemasPreviewModal
        open={initSchemasPreviewOpen}
        loading={generatingSchemas}
        result={initSchemasPreview}
        onCancel={() => setInitSchemasPreviewOpen(false)}
        onApply={() => {
          handleApplyInitSchemasPreview();
          setWizardStep(1);
        }}
        onApplyAndPersist={() => void handleApplyAndPersistInitSchemas()}
      />
    </AppDetailPage>
  );
};

export default ToolDetailPage;
