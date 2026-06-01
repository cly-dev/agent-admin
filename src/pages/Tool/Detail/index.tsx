import {
  getToolStatus,
  formatIntegrationHost,
} from '../useTools';
import type { ToolHttpMethod, ToolStatus } from '@/types/tool';
import { ArrowLeftOutlined, InfoCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { ApiTestPanel } from '@/components/ApiTestPanel';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, Link, useIntl } from '@umijs/max';
import { Form, Input, Select, Spin, Switch } from 'antd';
import { useMemo } from 'react';
import type { ToolFormValues } from '../useTools';
import ToolParametersEditor from '../components/ToolParametersEditor';
import ToolResponseEditors from '../components/ToolResponseEditors';
import styles from '../index.module.scss';
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
    fillTestParamsFromParameters,
  } = useToolDetail();

  const pageTitle = isCreateMode
    ? intl.formatMessage({ id: 'tool.detail.createTitle' })
    : tool?.name ?? intl.formatMessage({ id: 'tool.detail.title' });

  const displayMethod = (watchedMethod ?? tool?.method ?? 'Get') as ToolHttpMethod;
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

  return (
    <PageContainer ghost className={styles.toolPage}>
      <div className={styles.toolPageShell}>
        <div className={`${styles.toolPageCard} ${styles.toolDetailPage}`}>
          <Spin spinning={loading}>
            <header className={styles.toolDetailTopBar}>
              <button
                type="button"
                className={styles.toolDetailBack}
                onClick={handleDiscard}
              >
                <ArrowLeftOutlined />
                {intl.formatMessage({ id: 'tool.detail.back' })}
              </button>
              <div className={styles.toolDetailTopBarActions}>
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
                  disabled={!projectId || submitting}
                  onClick={() => form.submit()}
                >
                  <SaveOutlined />
                  {intl.formatMessage({ id: 'tool.detail.save' })}
                </button>
              </div>
            </header>

            <Form<ToolFormValues>
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={handleSubmit}
              onValuesChange={handleFormValuesChange}
            >
              <div className={styles.toolDetailGrid}>
                <div className={styles.toolDetailMain}>
                  <section className={styles.toolDetailSection}>
                    <h2 className={styles.toolDetailSectionTitle}>
                      <InfoCircleOutlined />
                      {intl.formatMessage({ id: 'tool.detail.basicInfo' })}
                    </h2>

                    <div className={styles.toolDetailIntro}>
                      <div className={styles.toolDetailTitleRow}>
                        <h1 className={styles.toolDetailTitle}>{pageTitle}</h1>
                        {!isCreateMode && statusPreview ? (
                          <span
                            className={`${styles.toolDetailStatusBadge} ${STATUS_BADGE_CLASS[statusPreview]}`}
                          >
                            {intl.formatMessage({ id: statusLabelId })}
                          </span>
                        ) : null}
                      </div>

                      {isCreateMode ? (
                        <p className={styles.toolDetailSubtitle}>
                          <FormattedMessage
                            id="tool.detail.createSubtitle"
                            values={{
                              integrationLink: (
                                <Link to="/integration" className={styles.toolDetailInlineLink}>
                                  {intl.formatMessage({ id: 'tool.integrationLink' })}
                                </Link>
                              ),
                            }}
                          />
                        </p>
                      ) : (
                        <p className={styles.toolDetailSubtitle}>
                          {intl.formatMessage({ id: 'tool.detail.subtitle' })}
                        </p>
                      )}

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
                              message: intl.formatMessage({ id: 'tool.form.integrationRequired' }),
                            },
                          ]}
                        >
                          <Select
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
                                message: intl.formatMessage({ id: 'tool.form.pathRequired' }),
                              },
                            ]}
                          >
                            <Input
                              className="app-input"
                              placeholder={intl.formatMessage({
                                id: 'tool.form.pathPlaceholder',
                              })}
                            />
                          </Form.Item>
                        </div>

                        <div className={styles.toolDetailEndpointPreview}>
                          <span className={styles.toolDetailEndpointPreviewLabel}>
                            {intl.formatMessage({ id: 'tool.detail.endpointPreview' })}
                          </span>
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
                      </div>
                    </div>

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
                            message: intl.formatMessage({ id: 'tool.form.nameRequired' }),
                          },
                        ]}
                      >
                        <Input
                          className="app-input"
                          placeholder={intl.formatMessage({ id: 'tool.form.namePlaceholder' })}
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
                          options={riskLevels.map((level) => ({
                            value: level,
                            label: level,
                          }))}
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
                            message: intl.formatMessage({ id: 'tool.form.descriptionRequired' }),
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

                      <div className={`${styles.toolDetailField} ${styles.toolDetailFieldFull}`}>
                        <div className={styles.toolDetailActiveRow}>
                          <div>
                            <span className={styles.toolDetailLabel}>
                              {intl.formatMessage({ id: 'tool.form.isActive' })}
                            </span>
                            <p className={styles.toolDetailFieldHint}>
                              {intl.formatMessage({ id: 'tool.detail.activeHint' })}
                            </p>
                          </div>
                          <Form.Item name="isActive" valuePropName="checked" noStyle>
                            <Switch />
                          </Form.Item>
                        </div>
                      </div>
                    </div>

                    <div className={styles.toolDetailParamsBlock}>
                      <h3 className={styles.toolDetailSubsectionTitle}>
                        {intl.formatMessage({ id: 'tool.detail.parameters' })}
                      </h3>
                      <p className={styles.toolDetailSectionDesc}>
                        {intl.formatMessage({ id: 'tool.detail.parametersDesc' })}
                      </p>
                      <ToolParametersEditor disabled={submitting} />
                    </div>

                    {!isCreateMode ? (
                      <div className={styles.toolDetailResponseBlock}>
                        <h3 className={styles.toolDetailSubsectionTitle}>
                          {intl.formatMessage({ id: 'tool.detail.responseSection' })}
                        </h3>
                        <p className={styles.toolDetailSectionDesc}>
                          {intl.formatMessage({ id: 'tool.detail.responseSectionDesc' })}
                        </p>

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
                      </div>
                    ) : null}
                  </section>
                </div>

                <aside className={styles.toolDetailAside}>
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
                    generateSchemasDisabled={isCreateMode}
                    result={testResult}
                    onRun={handleRunTest}
                    onGenerateSchemas={handleGenerateResponseSchemas}
                    generateSchemasLabel={intl.formatMessage({
                      id: 'tool.detail.generateResponseSchemas',
                    })}
                    onSyncParams={fillTestParamsFromParameters}
                    syncParamsLabel={intl.formatMessage({ id: 'tool.detail.fillTestFromParams' })}
                  />

                  {!isCreateMode && tool ? (
                    <section className={styles.toolDetailMetaCard}>
                      <h4 className={styles.toolDetailMetaTitle}>
                        {intl.formatMessage({ id: 'tool.detail.metaTitle' })}
                      </h4>
                      <dl className={styles.toolDetailMetaList}>
                        <div className={styles.toolDetailMetaItem}>
                          <dt>{intl.formatMessage({ id: 'tool.detail.metaRisk' })}</dt>
                          <dd>{tool.riskLevel}</dd>
                        </div>
                        <div className={styles.toolDetailMetaItem}>
                          <dt>{intl.formatMessage({ id: 'tool.detail.metaIntegration' })}</dt>
                          <dd>{selectedIntegration?.name ?? tool.integration?.name ?? '—'}</dd>
                        </div>
                        {tool.updatedAt ? (
                          <div className={styles.toolDetailMetaItem}>
                            <dt>{intl.formatMessage({ id: 'tool.detail.metaUpdated' })}</dt>
                            <dd>{new Date(tool.updatedAt).toLocaleString()}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </section>
                  ) : null}
                </aside>
              </div>
            </Form>
          </Spin>
        </div>
      </div>
    </PageContainer>
  );
};

export default ToolDetailPage;
