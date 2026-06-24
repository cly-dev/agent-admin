import type { AppClient } from '@/types/admin-app-client';
import type { AppClientAuthTestResult } from '@/types/app-client-auth';
import { ApiOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import type { FormInstance } from 'antd';
import { Alert, Form, Input, Select, Switch } from 'antd';
import { useMemo } from 'react';
import {
  HTTP_PROFILE_MAPPING_FORM_FIELDS,
  isValidProfileJsonPath,
  type ProjectAuthConfigFormValues,
} from '../appClientAuth';
import styles from '../Detail/index.module.scss';

const { TextArea } = Input;

type ProjectAuthConfigPanelProps = {
  project: AppClient;
  form: FormInstance<ProjectAuthConfigFormValues>;
  submitting?: boolean;
  testing?: boolean;
  testToken: string;
  testResult: AppClientAuthTestResult | null;
  useCustomConfig?: boolean;
  provider?: ProjectAuthConfigFormValues['provider'];
  rolesLoading?: boolean;
  authRoleOptions: Array<{ value: string; label: string }>;
  onTestTokenChange: (value: string) => void;
  onSave: () => void;
  onTest: () => void;
  onOpenChatTest: () => void;
};

const ProjectAuthConfigPanel: React.FC<ProjectAuthConfigPanelProps> = ({
  project,
  form,
  submitting = false,
  testing = false,
  testToken,
  testResult,
  useCustomConfig = false,
  provider = 'http_profile',
  rolesLoading = false,
  authRoleOptions,
  onTestTokenChange,
  onSave,
  onTest,
  onOpenChatTest,
}) => {
  const intl = useIntl();

  const providerOptions = useMemo(
    () => [
      {
        value: 'http_profile',
        label: intl.formatMessage({ id: 'project.auth.provider.httpProfile' }),
      },
      {
        value: 'jwt_shared_secret',
        label: intl.formatMessage({ id: 'project.auth.provider.jwt' }),
        disabled: true,
      },
    ],
    [intl],
  );

  const methodOptions = useMemo(
    () => [
      { value: 'GET', label: 'GET' },
      { value: 'POST', label: 'POST' },
    ],
    [],
  );

  const tokenPlacementOptions = useMemo(
    () => [
      {
        value: 'authorization_bearer',
        label: intl.formatMessage({ id: 'project.auth.tokenPlacement.bearer' }),
      },
      {
        value: 'header_x_account_token',
        label: intl.formatMessage({ id: 'project.auth.tokenPlacement.header' }),
      },
      {
        value: 'query_token',
        label: intl.formatMessage({ id: 'project.auth.tokenPlacement.query' }),
      },
    ],
    [intl],
  );

  const sourceLabel =
    testResult?.source === 'env_fallback'
      ? intl.formatMessage({ id: 'project.auth.testSource.env' })
      : intl.formatMessage({ id: 'project.auth.testSource.db' });

  return (
    <section className={styles.authSection}>
      <header className={styles.authHeader}>
        <div className={styles.authHeaderMain}>
          <p className={styles.authSubtitle}>
            {intl.formatMessage({ id: 'project.auth.subtitle' })}
          </p>
        </div>
        <div className={styles.authHeaderActions}>
          <button
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={submitting}
            onClick={onSave}
          >
            {intl.formatMessage({ id: 'project.auth.save' })}
          </button>
        </div>
      </header>

      <Alert
        type="info"
        showIcon
        className={styles.authAlert}
        message={intl.formatMessage({ id: 'project.auth.envFallbackTitle' })}
        description={intl.formatMessage({ id: 'project.auth.envFallbackDesc' })}
      />

      <Form form={form} layout="vertical" requiredMark={false} preserve>
        <div className={styles.authSwitchRow}>
          <div className={styles.authSwitchCopy}>
            <p className={styles.authSwitchLabel}>
              {intl.formatMessage({ id: 'project.auth.useCustomConfig' })}
            </p>
            <p className={styles.authSwitchHint}>
              {intl.formatMessage({ id: 'project.auth.useCustomConfigHint' })}
            </p>
          </div>
          <Form.Item
            name="useCustomConfig"
            valuePropName="checked"
            className={styles.switchField}
          >
            <Switch />
          </Form.Item>
        </div>

        {useCustomConfig ? (
          <div className={styles.authFormGrid}>
            <Form.Item
              name="provider"
              label={intl.formatMessage({ id: 'project.auth.provider' })}
              className={styles.authFormFull}
            >
              <Select className="app-input" options={providerOptions} />
            </Form.Item>

            {provider === 'jwt_shared_secret' ? (
              <Alert
                type="warning"
                showIcon
                className={styles.authFormFull}
                message={intl.formatMessage({
                  id: 'project.auth.jwtNotImplemented',
                })}
              />
            ) : null}

            {provider === 'http_profile' ? (
              <>
                <Form.Item
                  name="httpBaseUrl"
                  label={intl.formatMessage({ id: 'project.auth.httpBaseUrl' })}
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({
                        id: 'project.auth.httpBaseUrlRequired',
                      }),
                    },
                  ]}
                >
                  <Input
                    className="app-input"
                    placeholder="https://admin.example.com"
                  />
                </Form.Item>
                <Form.Item
                  name="httpProfilePath"
                  label={intl.formatMessage({
                    id: 'project.auth.httpProfilePath',
                  })}
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({
                        id: 'project.auth.httpProfilePathRequired',
                      }),
                    },
                  ]}
                >
                  <Input
                    className="app-input"
                    placeholder="/account/seller/account/current"
                  />
                </Form.Item>
                <Form.Item
                  name="httpMethod"
                  label={intl.formatMessage({ id: 'project.auth.httpMethod' })}
                >
                  <Select className="app-input" options={methodOptions} />
                </Form.Item>
                <Form.Item
                  name="httpTokenPlacement"
                  label={intl.formatMessage({
                    id: 'project.auth.httpTokenPlacement',
                  })}
                >
                  <Select
                    className="app-input"
                    options={tokenPlacementOptions}
                  />
                </Form.Item>

                <div className={styles.authMappingBlock}>
                  <h3 className={styles.authMappingTitle}>
                    {intl.formatMessage({ id: 'project.auth.mappingTitle' })}
                  </h3>
                  <p className={styles.authMappingHint}>
                    {intl.formatMessage({ id: 'project.auth.mappingHint' })}
                  </p>
                  <div className={styles.authMappingGrid}>
                    {HTTP_PROFILE_MAPPING_FORM_FIELDS.map((field) => (
                      <Form.Item
                        key={field.formKey}
                        name={field.formKey}
                        label={intl.formatMessage({
                          id: `project.auth.mapping.${field.mappingKey}`,
                        })}
                        rules={[
                          ...(field.required
                            ? [
                                {
                                  required: true,
                                  message: intl.formatMessage({
                                    id: 'project.auth.mappingRequired',
                                  }),
                                },
                              ]
                            : []),
                          {
                            validator: async (_, value) => {
                              const trimmed =
                                typeof value === 'string' ? value.trim() : '';
                              if (!trimmed) {
                                return;
                              }
                              if (!isValidProfileJsonPath(trimmed)) {
                                throw new Error(
                                  intl.formatMessage({
                                    id: 'project.auth.mappingPathInvalid',
                                  }),
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input
                          className="app-input font-mono text-sm"
                          placeholder={intl.formatMessage({
                            id: `project.auth.mapping.placeholder.${field.mappingKey}`,
                          })}
                        />
                      </Form.Item>
                    ))}
                  </div>
                </div>

                <Form.Item
                  name="extraHeadersJson"
                  label={intl.formatMessage({
                    id: 'project.auth.extraHeaders',
                  })}
                  extra={intl.formatMessage({
                    id: 'project.auth.extraHeadersHint',
                  })}
                  className={styles.authFormFull}
                >
                  <TextArea
                    className="app-input font-mono text-xs"
                    autoSize={{ minRows: 3, maxRows: 8 }}
                    placeholder={'{\n  "X-Custom-Header": "value"\n}'}
                  />
                </Form.Item>
              </>
            ) : null}

            <Form.Item
              name="autoBindRoleName"
              label={intl.formatMessage({
                id: 'project.auth.autoBindRoleName',
              })}
              extra={intl.formatMessage({
                id: 'project.auth.autoBindRoleNameHint',
              })}
            >
              <Select
                className="app-input"
                allowClear
                showSearch
                loading={rolesLoading}
                placeholder={intl.formatMessage({
                  id: 'project.auth.autoBindRoleNamePlaceholder',
                })}
                options={authRoleOptions}
                optionFilterProp="label"
              />
            </Form.Item>
            <div className={styles.authSwitchRow}>
              <div className={styles.authSwitchCopy}>
                <p className={styles.authSwitchLabel}>
                  {intl.formatMessage({ id: 'project.auth.propagateToken' })}
                </p>
                <p className={styles.authSwitchHint}>
                  {intl.formatMessage({
                    id: 'project.auth.propagateTokenHint',
                  })}
                </p>
              </div>
              <Form.Item
                name="propagateTokenToIntegrations"
                valuePropName="checked"
                className={styles.switchField}
              >
                <Switch />
              </Form.Item>
            </div>
          </div>
        ) : (
          <p className={styles.authEnvActiveHint}>
            {intl.formatMessage({ id: 'project.auth.usingEnvFallback' })}
          </p>
        )}
      </Form>

      <div className={styles.authTestBlock}>
        <header className={styles.authTestHeader}>
          <h3 className={styles.authTestTitle}>
            <ApiOutlined />
            {intl.formatMessage({ id: 'project.auth.testTitle' })}
          </h3>
          <p className={styles.authTestHint}>
            {intl.formatMessage(
              { id: 'project.auth.testHint' },
              { dsn: project.dsn ?? '—' },
            )}
          </p>
        </header>
        <div className={styles.authTestRow}>
          <Input
            className="app-input"
            value={testToken}
            placeholder={intl.formatMessage({
              id: 'project.auth.testTokenPlaceholder',
            })}
            onChange={(event) => onTestTokenChange(event.target.value)}
          />
          <button
            type="button"
            className="app-button-secondary shrink-0 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={testing || !project.dsn?.trim()}
            onClick={onOpenChatTest}
          >
            {intl.formatMessage({ id: 'project.auth.openChatTest' })}
          </button>
          <button
            type="button"
            className="app-button-primary shrink-0 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={testing}
            onClick={onTest}
          >
            {intl.formatMessage({ id: 'project.auth.testAction' })}
          </button>
        </div>

        {testResult ? (
          <div className={styles.authTestResult}>
            <div className={styles.authTestResultHead}>
              <span className={styles.authTestResultBadge}>{sourceLabel}</span>
            </div>
            <dl className={styles.authTestProfile}>
              {testResult.profile.employeeId ? (
                <div>
                  <dt>
                    {intl.formatMessage({
                      id: 'project.auth.profile.employeeId',
                    })}
                  </dt>
                  <dd>{testResult.profile.employeeId}</dd>
                </div>
              ) : null}
              <div>
                <dt>
                  {intl.formatMessage({ id: 'project.auth.profile.email' })}
                </dt>
                <dd>{testResult.profile.email || '—'}</dd>
              </div>
              <div>
                <dt>
                  {intl.formatMessage({ id: 'project.auth.profile.username' })}
                </dt>
                <dd>{testResult.profile.username || '—'}</dd>
              </div>
              <div>
                <dt>
                  {intl.formatMessage({ id: 'project.auth.profile.active' })}
                </dt>
                <dd>
                  {testResult.profile.active
                    ? intl.formatMessage({ id: 'status.active' })
                    : intl.formatMessage({ id: 'status.inactive' })}
                </dd>
              </div>
              {testResult.profile.nickName ? (
                <div>
                  <dt>
                    {intl.formatMessage({
                      id: 'project.auth.profile.nickName',
                    })}
                  </dt>
                  <dd>{testResult.profile.nickName}</dd>
                </div>
              ) : null}
              {testResult.profile.cnName ? (
                <div>
                  <dt>
                    {intl.formatMessage({ id: 'project.auth.profile.cnName' })}
                  </dt>
                  <dd>{testResult.profile.cnName}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default ProjectAuthConfigPanel;
