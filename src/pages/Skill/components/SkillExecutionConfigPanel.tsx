import { FileTextOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert, Form, Tag } from 'antd';
import { useMemo } from 'react';
import styles from '../index.module.scss';
import type {
  SkillPromptHostToolOption,
  SkillPromptToolOption,
} from '../skillPromptMention';
import type { SkillWorkflowState } from '../skillWorkflow';
import type { SkillExecutionMode, SkillFormValues } from '../useSkillDetail';
import SkillPromptMentionEditor from './SkillPromptMentionEditor';
import type { WorkflowBindingValue } from '@/types/workflow';
import WorkflowBindingPanel from '@/pages/Workflow/components/WorkflowBindingPanel';

type SkillExecutionConfigPanelProps = {
  projectId?: number;
  mode: SkillExecutionMode;
  onModeChange: (mode: SkillExecutionMode) => void;
  promptValue: string;
  onPromptChange: (value: string) => void;
  promptToolOptions: SkillPromptToolOption[];
  promptHostToolOptions: SkillPromptHostToolOption[];
  boundToolIds: number[];
  boundHostToolIds: number[];
  workflow: SkillWorkflowState;
  workflowBinding: WorkflowBindingValue;
  hasLegacyWorkflow: boolean;
  hostToolNameOptions: string[];
  useRawConfigOnly: boolean;
  saving?: boolean;
  promptDisabled?: boolean;
  onWorkflowChange: (workflow: SkillWorkflowState) => void;
  onWorkflowBindingChange: (value: WorkflowBindingValue) => void;
  skillSync?: {
    skillId: number;
    currentToolIds: number[];
    currentHostToolIds: number[];
    onSynced: (toolIds: number[], hostToolIds: number[]) => void;
  };
};

const PROMPT_PRIORITY_CHAR_LIMIT = 1200;

const SkillExecutionConfigPanel: React.FC<SkillExecutionConfigPanelProps> = ({
  projectId,
  mode,
  onModeChange,
  promptValue,
  onPromptChange,
  promptToolOptions,
  promptHostToolOptions,
  boundToolIds,
  boundHostToolIds,
  workflow,
  workflowBinding,
  hasLegacyWorkflow,
  hostToolNameOptions,
  useRawConfigOnly,
  saving = false,
  promptDisabled = false,
  onWorkflowChange: _onWorkflowChange,
  onWorkflowBindingChange,
  skillSync,
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

  const modeOptions: Array<{
    key: SkillExecutionMode;
    icon: React.ReactNode;
    titleId: string;
    descId: string;
  }> = [
    {
      key: 'prompt',
      icon: <FileTextOutlined />,
      titleId: 'skill.detail.mode.prompt.title',
      descId: 'skill.detail.mode.prompt.desc',
    },
    {
      key: 'workflow',
      icon: <NodeIndexOutlined />,
      titleId: 'skill.detail.mode.workflow.title',
      descId: 'skill.detail.mode.workflow.desc',
    },
  ];

  return (
    <div className={styles.skillExecutionPanel}>
      <div className={styles.skillExecutionIntro}>
        <p className={styles.skillDetailSectionHint}>
          {intl.formatMessage({ id: 'skill.detail.executionModeHint' })}
        </p>
      </div>

      <div
        className={styles.skillModeSelector}
        role="radiogroup"
        aria-label={intl.formatMessage({
          id: 'skill.detail.executionModeLabel',
        })}
      >
        {modeOptions.map((option) => {
          const active = mode === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={active}
              className={`${styles.skillModeCard} ${active ? styles.skillModeCardActive : ''}`.trim()}
              onClick={() => onModeChange(option.key)}
            >
              <span className={styles.skillModeCardIcon} aria-hidden>
                {option.icon}
              </span>
              <span className={styles.skillModeCardBody}>
                <span className={styles.skillModeCardTitle}>
                  {intl.formatMessage({ id: option.titleId })}
                </span>
                <span className={styles.skillModeCardDesc}>
                  {intl.formatMessage({ id: option.descId })}
                </span>
              </span>
            </button>
          );
        })}
      </div>

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
              disabled={promptDisabled}
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
            {intl.formatMessage({ id: 'skill.detail.workflowModeHint' })}
          </p>
          <Form.Item<SkillFormValues>
            name="prompt"
            label={intl.formatMessage({
              id: 'skill.detail.workflowFallbackPrompt',
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
            <SkillPromptMentionEditor
              value={promptValue}
              onChange={onPromptChange}
              tools={promptToolOptions}
              hostTools={promptHostToolOptions}
              boundToolIds={boundToolIds}
              boundHostToolIds={boundHostToolIds}
              disabled={promptDisabled}
              compact
            />
          </Form.Item>
          {hasLegacyWorkflow && !workflowBinding.workflowId ? (
            <Alert
              type="warning"
              showIcon
              className={styles.skillDetailAlert}
              message={intl.formatMessage({
                id: 'skill.workflow.legacyMigration',
              })}
            />
          ) : null}
          <WorkflowBindingPanel
            projectId={projectId}
            entry="skill"
            value={workflowBinding}
            disabled={saving || promptDisabled}
            boundToolIds={boundToolIds}
            boundHostToolIds={boundHostToolIds}
            onChange={onWorkflowBindingChange}
            skillSync={skillSync}
          />
        </div>
      )}
    </div>
  );
};

export default SkillExecutionConfigPanel;
