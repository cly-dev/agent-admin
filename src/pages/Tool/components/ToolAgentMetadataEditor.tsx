import type {
  AgentMetadata,
  ParamFormatHint,
} from '@/types/tool-agent-metadata';
import {
  OPERATION_TYPE_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
  TOOL_MODE_OPTIONS,
} from '@/types/tool-agent-metadata';
import { RobotOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import type { FormInstance } from 'antd';
import {
  Alert,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styles from '../index.module.scss';
import {
  AGENT_METADATA_TEMPLATES,
  createEmptyAgentMetadata,
  defaultPriorityForMode,
  deriveDecisionRoleFromAgentMetadata,
  isAgentMetadataFormComplete,
  mergeBusinessFieldOptions,
  normalizeAgentMetadata,
  pruneBusinessFieldsAgainstParameters,
  resolveBusinessFieldsToParameters,
  syncParamFormatHintsWithParameters,
  type AgentMetadataTemplateKey,
} from '../toolAgentMetadata';
import type { ToolParameter } from '../toolSchema';
import type { ToolFormValues } from '../useTools';
import CommaSeparatedInput from './CommaSeparatedInput';

type ToolAgentMetadataEditorProps = {
  form: FormInstance<ToolFormValues>;
  disabled?: boolean;
  isCreateMode?: boolean;
  /** 接口返回的 agentMetadata，用于加载后打开编辑区并回显 */
  savedAgentMetadata?: AgentMetadata | null;
};

const TEMPLATE_KEYS: AgentMetadataTemplateKey[] = [
  'productDetail',
  'productList',
  'priceUpdate',
  'productCreate',
];

export default function ToolAgentMetadataEditor({
  form,
  disabled,
  isCreateMode = false,
  savedAgentMetadata,
}: ToolAgentMetadataEditorProps) {
  const intl = useIntl();
  const agentMetadata = Form.useWatch('agentMetadata', form) as
    | AgentMetadata
    | null
    | undefined;
  const watchedParameters =
    (Form.useWatch('parameters', form) as ToolParameter[] | undefined) ?? [];
  const watchedBusinessFields = Form.useWatch(
    ['agentMetadata', 'businessFields'],
    form,
  ) as string[] | undefined;

  const businessFieldOptions = useMemo(
    () =>
      mergeBusinessFieldOptions(
        watchedParameters,
        watchedBusinessFields ??
          agentMetadata?.businessFields ??
          savedAgentMetadata?.businessFields,
        intl.formatMessage({ id: 'tool.agentMetadata.businessFieldSaved' }),
      ),
    [
      watchedParameters,
      watchedBusinessFields,
      agentMetadata?.businessFields,
      savedAgentMetadata?.businessFields,
      intl,
    ],
  );

  const hasInputParameters = watchedParameters.some((param) =>
    param.name.trim(),
  );

  /** 空态时未注册 agentMetadata 字段，仅靠 setFieldValue 无法驱动 useWatch 切到编辑区 */
  const [panelOpen, setPanelOpen] = useState(() =>
    isAgentMetadataFormComplete(form.getFieldValue('agentMetadata')),
  );

  useEffect(() => {
    if (isAgentMetadataFormComplete(agentMetadata)) {
      setPanelOpen(true);
    }
  }, [agentMetadata]);

  /** 详情加载后 form 已写入，但 useWatch 可能未触发，需根据接口数据打开面板 */
  useEffect(() => {
    const fromApi = normalizeAgentMetadata(savedAgentMetadata);
    if (!isAgentMetadataFormComplete(fromApi)) {
      return;
    }
    setPanelOpen(true);
    const current = normalizeAgentMetadata(form.getFieldValue('agentMetadata'));
    if (!isAgentMetadataFormComplete(current)) {
      form.setFieldsValue({
        agentMetadata: {
          ...fromApi,
          paramFormatHints: syncParamFormatHintsWithParameters(
            watchedParameters,
            fromApi.paramFormatHints,
          ),
        },
      });
    }
  }, [form, savedAgentMetadata, watchedParameters]);

  const configured = panelOpen;

  useEffect(() => {
    if (!configured) {
      return;
    }
    const current =
      (form.getFieldValue(['agentMetadata', 'businessFields']) as
        | string[]
        | undefined) ?? [];
    const resolved = resolveBusinessFieldsToParameters(
      current,
      watchedParameters,
    );
    const next = watchedParameters.some((param) => param.name.trim())
      ? pruneBusinessFieldsAgainstParameters(resolved, watchedParameters)
      : resolved;
    const changed =
      next.length !== current.length ||
      next.some((item, index) => item !== current[index]);
    if (changed) {
      form.setFieldValue(['agentMetadata', 'businessFields'], next);
    }
  }, [configured, form, watchedParameters]);

  useEffect(() => {
    if (!configured) {
      return;
    }
    const current =
      (form.getFieldValue(['agentMetadata', 'paramFormatHints']) as
        | ParamFormatHint[]
        | undefined) ?? [];
    const merged = syncParamFormatHintsWithParameters(
      watchedParameters,
      current,
    );
    const changed =
      merged.length !== current.length ||
      merged.some(
        (item, index) =>
          item.param !== current[index]?.param ||
          item.hint !== current[index]?.hint ||
          (item.example ?? '') !== (current[index]?.example ?? ''),
      );
    if (changed) {
      form.setFieldValue(['agentMetadata', 'paramFormatHints'], merged);
    }
  }, [configured, form, watchedParameters]);

  const derivedRole = useMemo(() => {
    if (!configured) {
      return '—';
    }
    const meta = (agentMetadata ?? form.getFieldValue('agentMetadata')) as
      | AgentMetadata
      | null
      | undefined;
    if (!isAgentMetadataFormComplete(meta)) {
      return '—';
    }
    return deriveDecisionRoleFromAgentMetadata(meta);
  }, [agentMetadata, configured, form]);

  const modeOptions = TOOL_MODE_OPTIONS.map((value) => ({
    value,
    label: intl.formatMessage({ id: `tool.agentMetadata.mode.${value}` }),
  }));

  const resourceOptions = RESOURCE_TYPE_OPTIONS.map((value) => ({
    value,
    label: intl.formatMessage({ id: `tool.agentMetadata.resource.${value}` }),
  }));

  const operationOptions = OPERATION_TYPE_OPTIONS.map((value) => ({
    value,
    label: intl.formatMessage({ id: `tool.agentMetadata.operation.${value}` }),
  }));

  const templateMenuItems = TEMPLATE_KEYS.map((key) => ({
    key,
    label: intl.formatMessage({ id: `tool.agentMetadata.template.${key}` }),
  }));

  const applyAgentMetadata = (value: AgentMetadata | null) => {
    if (value) {
      const resolved: AgentMetadata = {
        ...value,
        businessFields: resolveBusinessFieldsToParameters(
          value.businessFields,
          watchedParameters,
        ),
        paramFormatHints: syncParamFormatHintsWithParameters(
          watchedParameters,
          value.paramFormatHints,
        ),
      };
      form.setFieldsValue({ agentMetadata: resolved });
      setPanelOpen(true);
      return;
    }
    form.setFieldsValue({ agentMetadata: null });
    setPanelOpen(false);
  };

  const handleStartConfig = () => {
    applyAgentMetadata(createEmptyAgentMetadata('READ'));
  };

  const handleClearConfig = () => {
    applyAgentMetadata(null);
  };

  const handleApplyTemplate = (key: AgentMetadataTemplateKey) => {
    applyAgentMetadata({ ...AGENT_METADATA_TEMPLATES[key] });
  };

  const handleModeChange = (mode: AgentMetadata['mode']) => {
    const current = form.getFieldValue('agentMetadata') as AgentMetadata | null;
    if (!current) {
      return;
    }
    form.setFieldValue('agentMetadata', {
      ...current,
      mode,
      priority: defaultPriorityForMode(mode),
      isMutation: mode === 'WRITE',
    });
  };

  if (!configured) {
    return (
      <section className={styles.toolDetailAgentSection}>
        <h3 className={styles.toolDetailSubsectionTitle}>
          <RobotOutlined />
          {intl.formatMessage({ id: 'tool.agentMetadata.sectionTitle' })}
        </h3>
        <p className={styles.toolDetailSectionDesc}>
          {intl.formatMessage({ id: 'tool.agentMetadata.sectionDesc' })}
        </p>
        <Alert
          type="warning"
          showIcon
          className={styles.toolDetailAgentAlert}
          message={intl.formatMessage({ id: 'tool.agentMetadata.emptyTitle' })}
          description={intl.formatMessage({
            id: 'tool.agentMetadata.emptyDesc',
          })}
        />
        <div className={styles.toolDetailAgentActions}>
          <button
            type="button"
            className="app-button-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            onClick={handleStartConfig}
          >
            {intl.formatMessage({ id: 'tool.agentMetadata.startConfig' })}
          </button>
          <Dropdown
            trigger={['click']}
            disabled={disabled}
            menu={{
              items: templateMenuItems,
              onClick: ({ key }) =>
                handleApplyTemplate(key as AgentMetadataTemplateKey),
            }}
          >
            <button
              type="button"
              className="app-button-secondary inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
            >
              {intl.formatMessage({ id: 'tool.agentMetadata.applyTemplate' })}
            </button>
          </Dropdown>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.toolDetailAgentSection}>
      <div className={styles.toolDetailAgentSectionHead}>
        <div>
          <h3 className={styles.toolDetailSubsectionTitle}>
            <RobotOutlined />
            {intl.formatMessage({ id: 'tool.agentMetadata.sectionTitle' })}
          </h3>
          <p className={styles.toolDetailSectionDesc}>
            {intl.formatMessage({ id: 'tool.agentMetadata.sectionDesc' })}
          </p>
        </div>
        <div className={styles.toolDetailAgentActions}>
          <Dropdown
            trigger={['click']}
            disabled={disabled}
            menu={{
              items: templateMenuItems,
              onClick: ({ key }) =>
                handleApplyTemplate(key as AgentMetadataTemplateKey),
            }}
          >
            <button
              type="button"
              className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
            >
              {intl.formatMessage({ id: 'tool.agentMetadata.applyTemplate' })}
            </button>
          </Dropdown>
          <button
            type="button"
            className="app-button-delete inline-flex items-center gap-1.5 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            onClick={handleClearConfig}
          >
            {intl.formatMessage({ id: 'tool.agentMetadata.clearConfig' })}
          </button>
        </div>
      </div>

      <div className={styles.toolDetailAgentFormGrid}>
        <Form.Item
          name={['agentMetadata', 'mode']}
          className={styles.toolDetailField}
          label={
            <span className={styles.toolDetailLabel}>
              {intl.formatMessage({ id: 'tool.agentMetadata.mode' })}
            </span>
          }
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'tool.agentMetadata.modeRequired',
              }),
            },
          ]}
        >
          <Select
            options={modeOptions}
            disabled={disabled}
            onChange={handleModeChange}
          />
        </Form.Item>

        <Form.Item
          name={['agentMetadata', 'resource']}
          className={styles.toolDetailField}
          label={
            <span className={styles.toolDetailLabel}>
              {intl.formatMessage({ id: 'tool.agentMetadata.resource' })}
            </span>
          }
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'tool.agentMetadata.resourceRequired',
              }),
            },
          ]}
        >
          <Select
            options={resourceOptions}
            disabled={disabled}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          name={['agentMetadata', 'operation']}
          className={styles.toolDetailField}
          label={
            <span className={styles.toolDetailLabel}>
              {intl.formatMessage({ id: 'tool.agentMetadata.operation' })}
            </span>
          }
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'tool.agentMetadata.operationRequired',
              }),
            },
          ]}
        >
          <Select
            options={operationOptions}
            disabled={disabled}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          name={['agentMetadata', 'priority']}
          className={styles.toolDetailField}
          label={
            <span className={styles.toolDetailLabel}>
              {intl.formatMessage({ id: 'tool.agentMetadata.priority' })}
            </span>
          }
        >
          <InputNumber
            className={styles.toolDetailAgentNumber}
            min={0}
            max={9999}
            disabled={disabled}
          />
        </Form.Item>

        <Form.Item
          name={['agentMetadata', 'isMutation']}
          className={`${styles.toolDetailField} ${styles.toolDetailFieldFull}`}
          label={
            <span className={styles.toolDetailLabel}>
              {intl.formatMessage({ id: 'tool.agentMetadata.isMutation' })}
            </span>
          }
          valuePropName="checked"
        >
          <Switch disabled />
        </Form.Item>

        <div
          className={`${styles.toolDetailField} ${styles.toolDetailFieldFull}`}
        >
          <span className={styles.toolDetailLabel}>
            {intl.formatMessage({ id: 'tool.agentMetadata.decisionRole' })}
          </span>
          <p className={styles.toolDetailFieldHint}>
            {intl.formatMessage({ id: 'tool.agentMetadata.decisionRoleHint' })}
          </p>
          <Input className="app-input" readOnly value={derivedRole} />
        </div>

        <Form.Item
          name={['agentMetadata', 'businessFields']}
          className={`${styles.toolDetailField} ${styles.toolDetailFieldFull}`}
          label={
            <span className={styles.toolDetailLabel}>
              {intl.formatMessage({ id: 'tool.agentMetadata.businessFields' })}
            </span>
          }
          extra={
            !hasInputParameters ? (
              <span className={styles.toolDetailFieldHint}>
                {intl.formatMessage({
                  id: isCreateMode
                    ? 'tool.agentMetadata.businessFieldsEmptyCreate'
                    : 'tool.agentMetadata.businessFieldsEmpty',
                })}
              </span>
            ) : null
          }
        >
          <Select
            mode="multiple"
            disabled={disabled || !hasInputParameters}
            options={businessFieldOptions}
            placeholder={intl.formatMessage({
              id: hasInputParameters
                ? 'tool.agentMetadata.businessFieldsPlaceholder'
                : 'tool.agentMetadata.businessFieldsPlaceholderDisabled',
            })}
            showSearch
            optionFilterProp="label"
            maxTagCount="responsive"
          />
        </Form.Item>

        {/* <div className={`${styles.toolDetailField} ${styles.toolDetailFieldFull}`}>
          <div className={styles.toolDetailAgentHintsHead}>
            <div>
              <span className={styles.toolDetailLabel}>
                {intl.formatMessage({ id: 'tool.agentMetadata.paramFormatHints' })}
              </span>
              <p className={styles.toolDetailFieldHint}>
                {intl.formatMessage({ id: 'tool.agentMetadata.paramFormatHintsHint' })}
              </p>
            </div>
            <button
              type="button"
              className="app-button-secondary inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled || !hasInputParameters}
              onClick={handleRegenerateParamFormatHints}
            >
              {intl.formatMessage({ id: 'tool.agentMetadata.paramFormatHintsRegenerate' })}
            </button>
          </div>

          {!hasInputParameters ? (
            <p className={styles.toolDetailFieldHint}>
              {intl.formatMessage({ id: 'tool.agentMetadata.paramFormatHintsEmptyParams' })}
            </p>
          ) : (
            <Form.List name={['agentMetadata', 'paramFormatHints']}>
              {(fields, { add, remove }) => (
                <div className={styles.toolParamsEditor}>
                  <div className={styles.toolParamsTableWrap}>
                    <table className={styles.toolParamsTable}>
                      <thead>
                        <tr>
                          <th>{intl.formatMessage({ id: 'tool.agentMetadata.paramFormatHints.param' })}</th>
                          <th>{intl.formatMessage({ id: 'tool.agentMetadata.paramFormatHints.hint' })}</th>
                          <th>{intl.formatMessage({ id: 'tool.agentMetadata.paramFormatHints.example' })}</th>
                          <th aria-hidden />
                        </tr>
                      </thead>
                      <tbody>
                        {fields.length === 0 ? (
                          <tr>
                            <td colSpan={4} className={styles.toolParamsEmpty}>
                              {intl.formatMessage({ id: 'tool.agentMetadata.paramFormatHints.empty' })}
                            </td>
                          </tr>
                        ) : (
                          fields.map((field) => (
                            <tr key={field.key}>
                              <td>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'param']}
                                  className={styles.toolParamsCellField}
                                  rules={[
                                    {
                                      required: true,
                                      message: intl.formatMessage({
                                        id: 'tool.agentMetadata.paramFormatHints.paramRequired',
                                      }),
                                    },
                                  ]}
                                >
                                  <Select
                                    disabled={disabled}
                                    showSearch
                                    optionFilterProp="label"
                                    options={paramNameOptions}
                                    placeholder={intl.formatMessage({
                                      id: 'tool.agentMetadata.paramFormatHints.paramPlaceholder',
                                    })}
                                  />
                                </Form.Item>
                              </td>
                              <td>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'hint']}
                                  className={styles.toolParamsCellField}
                                  rules={[
                                    {
                                      required: true,
                                      message: intl.formatMessage({
                                        id: 'tool.agentMetadata.paramFormatHints.hintRequired',
                                      }),
                                    },
                                  ]}
                                >
                                  <Input.TextArea
                                    disabled={disabled}
                                    autoSize={{ minRows: 1, maxRows: 3 }}
                                    placeholder={intl.formatMessage({
                                      id: 'tool.agentMetadata.paramFormatHints.hintPlaceholder',
                                    })}
                                  />
                                </Form.Item>
                              </td>
                              <td>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'example']}
                                  className={styles.toolParamsCellField}
                                >
                                  <Input.TextArea
                                    disabled={disabled}
                                    autoSize={{ minRows: 1, maxRows: 6 }}
                                    placeholder={intl.formatMessage({
                                      id: 'tool.agentMetadata.paramFormatHints.examplePlaceholder',
                                    })}
                                  />
                                </Form.Item>
                              </td>
                              <td className={styles.toolParamsActions}>
                                <button
                                  type="button"
                                  className={styles.toolParamsDelete}
                                  disabled={disabled}
                                  aria-label={intl.formatMessage({ id: 'tool.params.remove' })}
                                  onClick={() => remove(field.name)}
                                >
                                  <DeleteOutlined />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    className={`app-button-secondary inline-flex w-full items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${styles.toolParamsAdd}`}
                    disabled={disabled}
                    onClick={() =>
                      add({
                        param: paramNameOptions[0]?.value ?? '',
                        hint: '',
                        example: '',
                      })
                    }
                  >
                    <PlusOutlined />
                    {intl.formatMessage({ id: 'tool.agentMetadata.paramFormatHints.add' })}
                  </button>
                </div>
              )}
            </Form.List>
          )}
        </div> */}

        <Form.Item
          name={['agentMetadata', 'aliases']}
          className={`${styles.toolDetailField} ${styles.toolDetailFieldFull}`}
          label={
            <span className={styles.toolDetailLabel}>
              {intl.formatMessage({ id: 'tool.agentMetadata.aliases' })}
            </span>
          }
        >
          <CommaSeparatedInput
            disabled={disabled}
            placeholder={intl.formatMessage({
              id: 'tool.agentMetadata.aliasesPlaceholder',
            })}
          />
        </Form.Item>

        <Form.Item
          name={['agentMetadata', 'examples']}
          className={`${styles.toolDetailField} ${styles.toolDetailFieldFull}`}
          label={
            <span className={styles.toolDetailLabel}>
              {intl.formatMessage({ id: 'tool.agentMetadata.examples' })}
            </span>
          }
        >
          <CommaSeparatedInput
            multiline
            disabled={disabled}
            placeholder={intl.formatMessage({
              id: 'tool.agentMetadata.examplesPlaceholder',
            })}
          />
        </Form.Item>
      </div>
    </section>
  );
}
