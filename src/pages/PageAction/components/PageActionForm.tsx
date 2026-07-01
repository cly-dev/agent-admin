import type { HostTool } from '@/types/host-tool';
import WorkflowBindingPanel from '@/pages/Workflow/components/WorkflowBindingPanel';
import type { WorkflowBindingValue } from '@/types/workflow';
import type { PageActionFillField } from '@/types/page-action';
import {
  ApiOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  LinkOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert, Collapse, Form, Input, InputNumber, Select, Switch } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { ReactNode } from 'react';
import {
  DEFAULT_PAGE_ACTION_SYSTEM_PROMPT,
  PAGE_ACTION_SYSTEM_PROMPT_MAX,
  formatHostToolOptionLabel,
  hostToolHasStreamFillField,
} from '../pageActionShared';
import type { PageActionFormValues } from '../pageActionFormShared';
import styles from '../index.module.scss';

type PageActionFormProps = {
  form: FormInstance<PageActionFormValues>;
  mode: 'create' | 'edit';
  editingActionKey?: string;
  hostTools: HostTool[];
  hostToolsLoading?: boolean;
  projectId?: number;
  workflowBinding?: WorkflowBindingValue;
  onWorkflowBindingChange?: (value: WorkflowBindingValue) => void;
  onPushHostToolResolved?: (hostToolId: number | null, hasPushNode: boolean) => void;
  hostToolIdLocked?: boolean;
  onFinish?: (values: PageActionFormValues) => void;
  onHostToolChange: (hostToolId?: number) => void;
  onActionKeyBlur?: () => void;
};

const FILL_FIELD_OPTIONS: PageActionFillField[] = ['text', 'content', 'value'];

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
          <span className={styles.hostToolSummaryValue}>{tool.description}</span>
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
  showInlineOverrides,
  hostToolIdLocked = false,
}: {
  form: FormInstance<PageActionFormValues>;
  hostTools: HostTool[];
  hostToolsLoading: boolean;
  onHostToolChange: (hostToolId?: number) => void;
  showInlineOverrides: boolean;
  hostToolIdLocked?: boolean;
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
            ? intl.formatMessage({ id: 'pageAction.form.workflowHostToolLockedHint' })
            : intl.formatMessage({ id: 'pageAction.form.hostToolBindHint' })
        }
      >
        <Select
          allowClear={!hostToolIdLocked}
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

      {showInlineOverrides && !hostToolId ? (
        <div className={`${styles.formFieldGrid} ${styles.formFieldGrid2}`}>
          <Form.Item
            name="hostToolName"
            label={intl.formatMessage({ id: 'pageAction.form.hostToolNameLabel' })}
          >
            <Input className="app-input" placeholder="fill_draft" />
          </Form.Item>
          <Form.Item
            name="hostToolFillField"
            label={intl.formatMessage({
              id: 'pageAction.form.hostToolFillFieldLabel',
            })}
          >
            <Select
              allowClear
              className="app-input"
              placeholder={intl.formatMessage({
                id: 'pageAction.form.hostToolFillFieldPlaceholder',
              })}
              options={FILL_FIELD_OPTIONS.map((value) => ({
                value,
                label: value,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="hostToolDescription"
            label={intl.formatMessage({
              id: 'pageAction.form.hostToolDescriptionLabel',
            })}
            className={styles.formFieldSpan2}
          >
            <Input.TextArea className="app-input" autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
        </div>
      ) : null}
    </>
  );
}

function IdentityFields({
  isCreate,
  editingActionKey,
  onActionKeyBlur,
}: {
  isCreate: boolean;
  editingActionKey?: string;
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
        <Form.Item label={intl.formatMessage({ id: 'pageAction.column.actionKey' })}>
          <Input className="app-input font-mono text-sm" value={editingActionKey} disabled />
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
          <Input className="app-input font-mono text-sm" placeholder="demo-playground" />
        </Form.Item>
        <Form.Item
          name="description"
          label={intl.formatMessage({ id: 'pageAction.column.description' })}
          className={styles.formFieldSpan2}
        >
          <Input.TextArea className="app-input" autoSize={{ minRows: 2, maxRows: 4 }} />
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
            {intl.formatMessage({ id: 'pageAction.column.allowCustomInstruction' })}
          </span>
          <Form.Item name="allowCustomInstruction" valuePropName="checked" noStyle>
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
  const promptLength = typeof systemPrompt === 'string' ? systemPrompt.length : 0;

  return (
    <Form.Item
      name="systemPrompt"
      className={styles.promptField}
      label={
        <div className={styles.promptToolbar}>
          <span>{intl.formatMessage({ id: 'pageAction.column.systemPrompt' })}</span>
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
            form.setFieldValue('systemPrompt', DEFAULT_PAGE_ACTION_SYSTEM_PROMPT)
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
  workflowBinding,
  onWorkflowBindingChange,
  onPushHostToolResolved,
  hostToolIdLocked = false,
  onFinish,
  onHostToolChange,
  onActionKeyBlur,
}) => {
  const intl = useIntl();
  const isCreate = mode === 'create';
  const hostToolId = Form.useWatch('hostToolId', form);

  const contextMessage = isCreate
    ? intl.formatMessage({
        id: hostToolId
          ? 'pageAction.form.hostToolCreateHint'
          : 'pageAction.form.simpleCreateHint',
      })
    : null;

  const hostToolPanel = (
    <FormPanel
      icon={<LinkOutlined />}
      title={intl.formatMessage({ id: 'pageAction.form.section.hostTool' })}
      hint={intl.formatMessage({ id: 'pageAction.form.section.hostToolHint' })}
    >
      <HostToolBindingFields
        form={form}
        hostTools={hostTools}
        hostToolsLoading={hostToolsLoading}
        onHostToolChange={onHostToolChange}
        showInlineOverrides={isCreate}
        hostToolIdLocked={hostToolIdLocked}
      />
    </FormPanel>
  );

  const identityPanel = (
    <FormPanel
      icon={<ApiOutlined />}
      title={intl.formatMessage({ id: 'pageAction.form.section.identity' })}
      hint={intl.formatMessage({ id: 'pageAction.form.section.identityHint' })}
    >
      <IdentityFields
        isCreate={isCreate}
        editingActionKey={editingActionKey}
        onActionKeyBlur={onActionKeyBlur}
      />
    </FormPanel>
  );

  const publishPanel = (
    <FormPanel
      icon={<SettingOutlined />}
      title={intl.formatMessage({ id: 'pageAction.form.section.publish' })}
      hint={intl.formatMessage({ id: 'pageAction.form.section.publishHint' })}
    >
      <PublishFields />
      {workflowBinding && onWorkflowBindingChange ? (
        <div className={styles.workflowBindingSection}>
          <h3 className={styles.workflowBindingTitle}>
            {intl.formatMessage({ id: 'pageAction.form.section.workflow' })}
          </h3>
          <WorkflowBindingPanel
            projectId={projectId}
            entry="page_action"
            value={workflowBinding}
            onChange={onWorkflowBindingChange}
            onPushHostToolResolved={onPushHostToolResolved}
          />
        </div>
      ) : null}
    </FormPanel>
  );

  const promptPanel = (
    <FormPanel
      icon={<FileTextOutlined />}
      iconAccent
      title={intl.formatMessage({ id: 'pageAction.form.section.prompt' })}
      hint={intl.formatMessage({ id: 'pageAction.form.section.promptHint' })}
      className={styles.formPanelPrompt}
    >
      <div className={styles.formPanelBodyGrow}>
        <PromptField form={form} />
      </div>
    </FormPanel>
  );

  return (
    <Form<PageActionFormValues>
      form={form}
      layout="vertical"
      requiredMark={false}
      className={styles.formPage}
      onFinish={onFinish}
    >
      <div className={styles.formLayout}>
        {contextMessage ? (
          <p className={styles.contextStrip} role="note">
            {contextMessage}
          </p>
        ) : null}

        {isCreate ? (
          <div className={`${styles.formGrid} ${styles.formGridPage}`}>
            <div className={styles.formMain}>
              {hostToolPanel}
              {identityPanel}
              {publishPanel}
            </div>
            <aside className={`${styles.formAside} ${styles.formAsideSticky}`}>
              {promptPanel}
            </aside>
          </div>
        ) : (
          <div className={styles.formCompactStack}>
            {identityPanel}
            {promptPanel}
            {publishPanel}
            <Collapse
              bordered={false}
              className="bg-transparent"
              items={[
                {
                  key: 'advanced',
                  label: intl.formatMessage({ id: 'pageAction.form.advancedTitle' }),
                  children: (
                    <HostToolBindingFields
                      form={form}
                      hostTools={hostTools}
                      hostToolsLoading={hostToolsLoading}
                      onHostToolChange={onHostToolChange}
                      showInlineOverrides={false}
                    />
                  ),
                },
              ]}
            />
          </div>
        )}
      </div>
    </Form>
  );
};

export default PageActionForm;
