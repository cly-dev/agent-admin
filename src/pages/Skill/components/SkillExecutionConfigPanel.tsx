import WorkflowBindingPanel from '@/pages/Workflow/components/WorkflowBindingPanel';
import type { WorkflowBindingValue } from '@/types/workflow';
import { useIntl } from '@umijs/max';
import { Alert, Form, Input, Tag } from 'antd';
import { useMemo } from 'react';
import styles from '../index.module.scss';
import type {
  SkillPromptHostToolOption,
  SkillPromptToolOption,
} from '../skillPromptMention';
import type {
  SkillHostToolTabKey,
  SkillHostToolTabRow,
} from '../skillHostTools';
import type { SkillExecutionMode, SkillFormValues, SkillToolRow } from '../useSkillDetail';
import SkillPromptMentionEditor from './SkillPromptMentionEditor';

type SkillExecutionConfigPanelProps = {
  projectId?: number;
  mode: SkillExecutionMode;
  promptValue: string;
  onPromptChange: (value: string) => void;
  promptToolOptions?: SkillPromptToolOption[];
  promptHostToolOptions?: SkillPromptHostToolOption[];
  boundToolIds?: number[];
  boundHostToolIds?: number[];
  toolRows?: SkillToolRow[];
  selectedToolIds?: number[];
  mutationHostToolRows?: SkillHostToolTabRow[];
  planHostToolRows?: SkillHostToolTabRow[];
  workflowBinding?: WorkflowBindingValue;
  hasLegacyWorkflow?: boolean;
  useRawConfigOnly?: boolean;
  saving?: boolean;
  promptDisabled?: boolean;
  onWorkflowBindingChange?: (value: WorkflowBindingValue) => void;
  onToolSelectionChange?: (toolIds: number[]) => void;
  onToolRequiredChange?: (toolId: number, isRequired: boolean) => void;
  onHostToolRowChange?: (
    tab: SkillHostToolTabKey,
    hostToolId: number,
    patch: Partial<
      Pick<
        SkillHostToolTabRow,
        'enabled' | 'trigger' | 'priority' | 'isRequired' | 'argsTemplateJson'
      >
    >,
  ) => void;
};

const PROMPT_PRIORITY_CHAR_LIMIT = 1200;

const SkillExecutionConfigPanel: React.FC<SkillExecutionConfigPanelProps> = ({
  projectId,
  mode,
  promptValue,
  onPromptChange,
  promptToolOptions = [],
  promptHostToolOptions = [],
  boundToolIds = [],
  boundHostToolIds = [],
  toolRows = [],
  selectedToolIds = [],
  mutationHostToolRows = [],
  planHostToolRows = [],
  workflowBinding,
  hasLegacyWorkflow = false,
  useRawConfigOnly = false,
  saving = false,
  promptDisabled = false,
  onWorkflowBindingChange,
  onToolSelectionChange,
  onToolRequiredChange,
  onHostToolRowChange,
}) => {
  const intl = useIntl();

  const promptPlainLength = useMemo(() => {
    const plain = promptValue.replace(
      /@\[[^\]]+\]\([^)]+\)/g,
      (match: string) => {
        const labelMatch = match.match(/@\[([^\]]+)\]/);
        return labelMatch?.[1] ?? match;
      },
    );
    return plain.length;
  }, [promptValue]);

  return (
    <div className={styles.skillExecutionPanel}>
      {mode === 'prompt' ? (
        <div className={styles.skillExecutionContent}>
          <p className={styles.skillDetailSectionHint}>
            {intl.formatMessage({ id: 'skill.detail.promptPriorityHint' })}
          </p>
          <Form.Item<SkillFormValues>
            name="prompt"
            label={
              <span className={styles.skillPromptLabel}>
                {intl.formatMessage({ id: 'skill.column.prompt' })}
                <Tag
                  className={styles.skillPromptLengthTag}
                  color={
                    promptPlainLength > PROMPT_PRIORITY_CHAR_LIMIT
                      ? 'orange'
                      : 'default'
                  }
                >
                  {intl.formatMessage(
                    { id: 'skill.detail.promptCharCount' },
                    {
                      count: promptPlainLength,
                      limit: PROMPT_PRIORITY_CHAR_LIMIT,
                    },
                  )}
                </Tag>
              </span>
            }
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'skill.form.promptRequired',
                }),
              },
            ]}
            className={styles.skillPromptFormItem}
          >
            <SkillPromptMentionEditor
              value={promptValue}
              onChange={onPromptChange}
              tools={promptToolOptions}
              hostTools={promptHostToolOptions}
              boundToolIds={boundToolIds}
              boundHostToolIds={boundHostToolIds}
              toolRows={toolRows}
              selectedToolIds={selectedToolIds}
              mutationHostToolRows={mutationHostToolRows}
              planHostToolRows={planHostToolRows}
              disabled={promptDisabled}
              saving={saving}
              onToolSelectionChange={onToolSelectionChange}
              onToolRequiredChange={onToolRequiredChange}
              onHostToolRowChange={onHostToolRowChange}
            />
          </Form.Item>
        </div>
      ) : (
        <div className={styles.skillExecutionContent}>
          {useRawConfigOnly ? (
            <Alert
              type="info"
              showIcon
              className={styles.skillDetailAlert}
              message={intl.formatMessage({
                id: 'skill.workflow.rawConfigOverride',
              })}
            />
          ) : null}
          <p className={styles.skillDetailSectionHint}>
            {intl.formatMessage({ id: 'skill.detail.workflowOnlyModeHint' })}
          </p>
          <Form.Item<SkillFormValues>
            name="prompt"
            label={intl.formatMessage({
              id: 'skill.column.prompt',
            })}
            extra={intl.formatMessage({
              id: 'skill.detail.workflowFallbackPromptHint',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'skill.form.promptRequired',
                }),
              },
            ]}
          >
            <Input.TextArea
              className="app-input"
              autoSize={{ minRows: 3, maxRows: 8 }}
              disabled={promptDisabled}
            />
          </Form.Item>
          {hasLegacyWorkflow && !workflowBinding?.workflowId ? (
            <Alert
              type="warning"
              showIcon
              className={styles.skillDetailAlert}
              message={intl.formatMessage({
                id: 'skill.workflow.legacyMigration',
              })}
            />
          ) : null}
          {workflowBinding && onWorkflowBindingChange ? (
            <WorkflowBindingPanel
              projectId={projectId}
              entry="skill"
              value={workflowBinding}
              disabled={saving || promptDisabled}
              onChange={onWorkflowBindingChange}
              skillBindingMode="workflow_only"
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SkillExecutionConfigPanel;
