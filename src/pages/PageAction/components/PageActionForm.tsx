import WorkflowBindingPanel from '@/pages/Workflow/components/WorkflowBindingPanel';
import PageScopeSelect from '@/components/PageScopeSelect';
import type { HostTool } from '@/types/host-tool';
import type { WorkflowBindingValue } from '@/types/workflow';
import {
  ApartmentOutlined,
  ApiOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert, Form, Input, InputNumber, Select, Switch } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { ReactNode } from 'react';
import styles from '../index.module.scss';
import type {
  PageActionConfigMode,
  PageActionFormValues,
} from '../pageActionFormShared';
import {
  DEFAULT_PAGE_ACTION_SYSTEM_PROMPT,
  PAGE_ACTION_SYSTEM_PROMPT_MAX,
  formatHostToolOptionLabel,
  hostToolHasStreamFillField,
} from '../pageActionShared';
import PageActionConfigModePicker from './PageActionConfigModePicker';
import PageActionWorkflowPushPreview from './PageActionWorkflowPushPreview';

type PageActionFormProps = {
  form: FormInstance<PageActionFormValues>;
  mode: 'create' | 'edit';
  editingActionKey?: string;
  hostTools: HostTool[];
  hostToolsLoading?: boolean;
  projectId?: number;
  configMode: PageActionConfigMode;
  onConfigModeChange: (mode: PageActionConfigMode) => void;
  workflowBinding?: WorkflowBindingValue;
  onWorkflowBindingChange?: (value: WorkflowBindingValue) => void;
  onPushHostToolResolved?: (
    hostToolId: number | null,
    hasPushNode: boolean,
  ) => void;
  workflowPushState?: {
    hasPushNode: boolean;
    pushHostToolId: number | null;
  };
  onFinish?: (values: PageActionFormValues) => void;
  onHostToolChange: (hostToolId?: number) => void;
  onActionKeyBlur?: () => void;
};

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

function HostToolSummary({ tool }: { tool: HostTool }) {
  const intl = useIntl();

  return (
    <div className={styles.hostToolSummary}>
      <div className={styles.hostToolSummaryItem}>
        <span className={styles.hostToolSummaryLabel}>
          {intl.formatMessage({ id: 'hostTool.column.name' })}
        </span>
        <span
          className={`${styles.hostToolSummaryValue} ${styles.hostToolSummaryValueMono}`}
        >
          {tool.name}
        </span>
      </div>
      <div className={styles.hostToolSummaryItem}>
        <span className={styles.hostToolSummaryLabel}>
          {intl.formatMessage({ id: 'hostTool.column.pageScope' })}
        </span>
        <span className={styles.hostToolSummaryValue}>
          {tool.pageScope?.trim() ||
            intl.formatMessage({ id: 'hostTool.pageScope.generic' })}
        </span>
      </div>
      <div className={styles.hostToolSummaryItem}>
        <span className={styles.hostToolSummaryLabel}>
          {intl.formatMessage({ id: 'hostTool.column.definitionKey' })}
        </span>
        <span
          className={`${styles.hostToolSummaryValue} ${styles.hostToolSummaryValueMono}`}
        >
          {tool.definitionKey}
        </span>
      </div>
      {tool.description ? (
        <div
          className={`${styles.hostToolSummaryItem} ${styles.hostToolSummaryItemWide}`}
        >
          <span className={styles.hostToolSummaryLabel}>
            {intl.formatMessage({ id: 'hostTool.column.description' })}
          </span>
          <span className={styles.hostToolSummaryValue}>
            {tool.description}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function HostToolBindingFields({
  form,
  hostTools,
  hostToolsLoading,
  onHostToolChange,
  hostToolIdLocked = false,
  allowClear = true,
  required = false,
}: {
  form: FormInstance<PageActionFormValues>;
  hostTools: HostTool[];
  hostToolsLoading: boolean;
  onHostToolChange: (hostToolId?: number) => void;
  hostToolIdLocked?: boolean;
  allowClear?: boolean;
  required?: boolean;
}) {
  const intl = useIntl();
  const hostToolId = Form.useWatch('hostToolId', form);
  const selectedTool = hostTools.find((tool) => tool.id === hostToolId);

  return (
    <>
      <Form.Item
        name="hostToolId"
        label={intl.formatMessage({ id: 'pageAction.form.hostToolIdLabel' })}
        extra={
          hostToolIdLocked
            ? intl.formatMessage({
                id: 'pageAction.form.workflowHostToolLockedHint',
              })
            : required
              ? intl.formatMessage({
                  id: 'pageAction.form.hostToolRequiredHint',
                })
              : intl.formatMessage({ id: 'pageAction.form.hostToolBindHint' })
        }
        rules={
          required
            ? [
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pageAction.form.hostToolRequired',
                  }),
                },
              ]
            : undefined
        }
      >
        <Select
          allowClear={!hostToolIdLocked && !required && allowClear}
          showSearch={!hostToolIdLocked}
          disabled={hostToolIdLocked}
          loading={hostToolsLoading}
          className="app-input"
          optionFilterProp="label"
          placeholder={intl.formatMessage({
            id: 'pageAction.form.hostToolPlaceholder',
          })}
          options={hostTools.map((tool) => ({
            value: tool.id,
            label: formatHostToolOptionLabel(tool),
          }))}
          onChange={(value) => {
            const nextId = typeof value === 'number' ? value : undefined;
            onHostToolChange(nextId);
          }}
        />
      </Form.Item>

      {selectedTool ? (
        <>
          <span className={styles.hostToolAppliedBadge}>
            <CheckCircleFilled />
            {intl.formatMessage({ id: 'pageAction.form.hostToolApplied' })}
          </span>
          <HostToolSummary tool={selectedTool} />
          {!hostToolHasStreamFillField(selectedTool) ? (
            <Alert
              type="warning"
              showIcon
              message={intl.formatMessage({
                id: 'pageAction.form.hostToolStreamWarning',
              })}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}

function IdentityFields({
  isCreate,
  editingActionKey,
  projectId,
  currentPageScope,
  onActionKeyBlur,
}: {
  isCreate: boolean;
  editingActionKey?: string;
  projectId?: number;
  currentPageScope?: string;
  onActionKeyBlur?: () => void;
}) {
  const intl = useIntl();

  return (
    <>
      {isCreate ? (
        <Form.Item
          name="actionKey"
          label={intl.formatMessage({ id: 'pageAction.column.actionKey' })}
          extra={intl.formatMessage({ id: 'pageAction.form.actionKeyHint' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pageAction.form.actionKeyRequired',
              }),
            },
          ]}
        >
          <Input
            className="app-input font-mono text-sm"
            placeholder="demo-playground.fill_draft"
            onBlur={onActionKeyBlur}
          />
        </Form.Item>
      ) : (
        <Form.Item
          label={intl.formatMessage({ id: 'pageAction.column.actionKey' })}
        >
          <Input
            className="app-input font-mono text-sm"
            value={editingActionKey}
            disabled
          />
        </Form.Item>
      )}

      <div className={`${styles.formFieldGrid} ${styles.formFieldGrid2}`}>
        <Form.Item
          name="name"
          label={intl.formatMessage({ id: 'pageAction.column.name' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pageAction.form.nameRequired',
              }),
            },
          ]}
        >
          <Input className="app-input" />
        </Form.Item>
        <Form.Item
          name="pageScope"
          label={intl.formatMessage({ id: 'pageAction.column.pageScope' })}
          extra={intl.formatMessage({ id: 'pageAction.form.pageScopeHint' })}
        >
          <PageScopeSelect
            appClientId={projectId}
            extraScope={currentPageScope}
            placeholder={intl.formatMessage({
              id: 'pageScope.selectPlaceholder',
            })}
          />
        </Form.Item>
        <Form.Item
          name="description"
          label={intl.formatMessage({ id: 'pageAction.column.description' })}
          className={styles.formFieldSpan2}
        >
          <Input.TextArea
            className="app-input"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
      </div>
    </>
  );
}

function PublishFields() {
  const intl = useIntl();

  return (
    <>
      <Form.Item
        name="sortOrder"
        label={intl.formatMessage({ id: 'pageAction.column.sortOrder' })}
      >
        <InputNumber className="app-input w-full" min={0} />
      </Form.Item>

      <div className={styles.formSwitchRow}>
        <div className={styles.formSwitchItem}>
          <span className={styles.formSwitchLabel}>
            {intl.formatMessage({
              id: 'pageAction.column.allowCustomInstruction',
            })}
          </span>
          <Form.Item
            name="allowCustomInstruction"
            valuePropName="checked"
            noStyle
          >
            <Switch />
          </Form.Item>
        </div>
        <div className={styles.formSwitchItem}>
          <span className={styles.formSwitchLabel}>
            {intl.formatMessage({ id: 'pageAction.column.isActive' })}
          </span>
          <Form.Item name="isActive" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </div>
      </div>
    </>
  );
}

function PromptField({ form }: { form: FormInstance<PageActionFormValues> }) {
  const intl = useIntl();
  const systemPrompt = Form.useWatch('systemPrompt', form);
  const promptLength =
    typeof systemPrompt === 'string' ? systemPrompt.length : 0;

  return (
    <Form.Item
      name="systemPrompt"
      className={styles.promptField}
      label={
        <div className={styles.promptToolbar}>
          <span>
            {intl.formatMessage({ id: 'pageAction.column.systemPrompt' })}
          </span>
          <span className={styles.promptCounter}>
            {promptLength}/{PAGE_ACTION_SYSTEM_PROMPT_MAX}
          </span>
        </div>
      }
      extra={
        <button
          type="button"
          className={styles.promptTemplateBtn}
          onClick={() =>
            form.setFieldValue(
              'systemPrompt',
              DEFAULT_PAGE_ACTION_SYSTEM_PROMPT,
            )
          }
        >
          {intl.formatMessage({ id: 'pageAction.form.insertTemplate' })}
        </button>
      }
      rules={[
        {
          required: true,
          message: intl.formatMessage({
            id: 'pageAction.form.systemPromptRequired',
          }),
        },
        {
          max: PAGE_ACTION_SYSTEM_PROMPT_MAX,
          message: intl.formatMessage(
            { id: 'pageAction.form.systemPromptTooLong' },
            { max: PAGE_ACTION_SYSTEM_PROMPT_MAX },
          ),
        },
      ]}
    >
      <Input.TextArea
        className="app-input font-mono text-xs"
        autoSize={{ minRows: 12, maxRows: 24 }}
      />
    </Form.Item>
  );
}

const PageActionForm: React.FC<PageActionFormProps> = ({
  form,
  mode,
  editingActionKey,
  hostTools,
  hostToolsLoading = false,
  projectId,
  configMode,
  onConfigModeChange,
  workflowBinding,
  onWorkflowBindingChange,
  onPushHostToolResolved,
  workflowPushState,
  onFinish,
  onHostToolChange,
  onActionKeyBlur,
}) => {
  const intl = useIntl();
  const isCreate = mode === 'create';
  const isPromptMode = configMode === 'prompt';
  const currentPageScope = Form.useWatch('pageScope', form);

  return (
    <Form<PageActionFormValues>
      form={form}
      layout="vertical"
      requiredMark={false}
      className={styles.formPage}
      onFinish={onFinish}
    >
      <div className={styles.formLayout}>
        <FormPanel
          icon={<ApiOutlined />}
          title={intl.formatMessage({ id: 'pageAction.form.section.identity' })}
          hint={intl.formatMessage({
            id: 'pageAction.form.section.identityHint',
          })}
        >
          <IdentityFields
            isCreate={isCreate}
            editingActionKey={editingActionKey}
            projectId={projectId}
            currentPageScope={
              typeof currentPageScope === 'string' ? currentPageScope : undefined
            }
            onActionKeyBlur={onActionKeyBlur}
          />
        </FormPanel>

        <PageActionConfigModePicker
          value={configMode}
          onChange={onConfigModeChange}
        />

        {isPromptMode ? (
          <FormPanel
            icon={<FileTextOutlined />}
            iconAccent
            title={intl.formatMessage({
              id: 'pageAction.form.configMode.prompt.panelTitle',
            })}
            hint={intl.formatMessage({
              id: 'pageAction.form.configMode.prompt.panelHint',
            })}
            className={styles.formPanelPrompt}
          >
            <div className={styles.formPanelBodyGrow}>
              <PromptField form={form} />
            </div>
            <HostToolBindingFields
              form={form}
              hostTools={hostTools}
              hostToolsLoading={hostToolsLoading}
              onHostToolChange={onHostToolChange}
              required
            />
          </FormPanel>
        ) : (
          <FormPanel
            icon={<ApartmentOutlined />}
            title={intl.formatMessage({
              id: 'pageAction.form.configMode.workflow.panelTitle',
            })}
            hint={intl.formatMessage({
              id: 'pageAction.form.configMode.workflow.panelHint',
            })}
          >
            <Alert
              type="info"
              showIcon
              className={styles.configModeWorkflowAlert}
              message={intl.formatMessage({
                id: 'pageAction.form.configMode.workflow.alert',
              })}
            />
            {workflowBinding && onWorkflowBindingChange ? (
              <WorkflowBindingPanel
                projectId={projectId}
                entry="page_action"
                value={workflowBinding}
                onChange={onWorkflowBindingChange}
                onPushHostToolResolved={onPushHostToolResolved}
              />
            ) : null}
            <PageActionWorkflowPushPreview
              hasPushNode={workflowPushState?.hasPushNode ?? false}
              pushHostToolId={workflowPushState?.pushHostToolId ?? null}
              hostTools={hostTools}
            />
            <div className={styles.workflowModePromptSection}>
              <PromptField form={form} />
            </div>
          </FormPanel>
        )}

        <FormPanel
          icon={<SettingOutlined />}
          title={intl.formatMessage({ id: 'pageAction.form.section.publish' })}
          hint={intl.formatMessage({
            id: 'pageAction.form.section.publishHint',
          })}
        >
          <PublishFields />
        </FormPanel>
      </div>
    </Form>
  );
};

export default PageActionForm;
