import { DesktopOutlined, ToolOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import { useMemo } from 'react';
import {
  Mention,
  MentionsInput,
  type SuggestionDataItem,
} from 'react-mentions';
import type {
  SkillPromptHostToolOption,
  SkillPromptToolOption,
} from '../skillPromptMention';
import { buildUnifiedMentionData } from '../skillPromptMention';
import styles from './SkillPromptMentionEditor.module.scss';

type SkillPromptMentionEditorProps = {
  value: string;
  onChange: (value: string) => void;
  tools: SkillPromptToolOption[];
  hostTools: SkillPromptHostToolOption[];
  boundToolIds: number[];
  boundHostToolIds: number[];
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
};

type MentionSuggestion = SuggestionDataItem & {
  kind: 'tool' | 'hostTool';
  description?: string;
  method?: string;
  path?: string;
  pageScope?: string | null;
};

const SkillPromptMentionEditor: React.FC<SkillPromptMentionEditorProps> = ({
  value,
  onChange,
  tools,
  hostTools,
  boundToolIds,
  boundHostToolIds,
  disabled = false,
  placeholder,
  compact = false,
}) => {
  const intl = useIntl();

  const boundTools = useMemo(
    () => tools.filter((tool) => boundToolIds.includes(tool.toolId)),
    [boundToolIds, tools],
  );

  const boundHostTools = useMemo(
    () =>
      hostTools.filter((tool) => boundHostToolIds.includes(tool.hostToolId)),
    [boundHostToolIds, hostTools],
  );

  const mentionData = useMemo(
    () => buildUnifiedMentionData(boundTools, boundHostTools),
    [boundHostTools, boundTools],
  );

  const suggestions: MentionSuggestion[] = useMemo(
    () =>
      mentionData.map((item) => {
        if (item.kind === 'tool') {
          const toolId = Number(item.id.split(':')[1]);
          const tool = boundTools.find((row) => row.toolId === toolId);
          return {
            ...item,
            kind: 'tool' as const,
            description: tool?.description,
            method: tool?.method,
            path: tool?.path,
          };
        }
        const hostToolId = Number(item.id.split(':')[1]);
        const hostTool = boundHostTools.find(
          (row) => row.hostToolId === hostToolId,
        );
        return {
          ...item,
          kind: 'hostTool' as const,
          description: hostTool?.description,
          pageScope: hostTool?.pageScope,
        };
      }),
    [boundHostTools, boundTools, mentionData],
  );

  const canMention = boundTools.length > 0 || boundHostTools.length > 0;
  const showEditor = !disabled;

  const disabledMessage = (() => {
    if (disabled) {
      return intl.formatMessage({ id: 'skill.promptMention.selectAgentFirst' });
    }
    if (tools.length === 0 && hostTools.length === 0) {
      return intl.formatMessage({ id: 'skill.promptMention.noTools' });
    }
    if (!canMention) {
      return intl.formatMessage({ id: 'skill.promptMention.bindToolsFirst' });
    }
    return '';
  })();

  const editorMinHeight = compact ? 96 : 200;

  return (
    <div className={styles.composerWrap}>
      <div
        className={`${styles.composer} ${!showEditor ? styles.composerDisabled : ''} ${compact ? styles.composerCompact : ''}`.trim()}
      >
        {!compact ? (
          <div className={styles.composerHeader}>
            <span className={styles.composerHeaderTitle}>
              {intl.formatMessage({ id: 'skill.promptMention.composerTitle' })}
            </span>
            {showEditor && canMention ? (
              <span className={styles.composerHeaderBadge}>
                {intl.formatMessage({
                  id: 'skill.promptMention.composerBadgeBound',
                })}
              </span>
            ) : (
              <span className={styles.composerHeaderHint}>
                {disabledMessage}
              </span>
            )}
          </div>
        ) : null}

        {showEditor ? (
          <div className={styles.composerBodySingle}>
            <div
              className={styles.composerEditor}
              style={{ minHeight: editorMinHeight }}
            >
              <MentionsInput
                value={value}
                onChange={(_event, nextValue) => onChange(nextValue)}
                placeholder={
                  placeholder ??
                  (canMention
                    ? intl.formatMessage({
                        id: 'skill.promptMention.placeholder',
                      })
                    : intl.formatMessage({
                        id: 'skill.promptMention.bindToolsFirst',
                      }))
                }
                allowSpaceInQuery
                a11ySuggestionsListLabel={intl.formatMessage({
                  id: 'skill.promptMention.suggestions',
                })}
                suggestionsPortalHost={
                  typeof document !== 'undefined' ? document.body : undefined
                }
                classNames={{
                  input: 'skill-prompt-mentions__input',
                  control: 'skill-prompt-mentions__control',
                  highlighter: 'skill-prompt-mentions__highlighter',
                  suggestions: 'skill-prompt-mentions__suggestions',
                }}
              >
                <Mention
                  trigger="@"
                  markup="@[__display__](__id__)"
                  displayTransform={(_id, display) => `@${display}`}
                  data={canMention ? suggestions : []}
                  className="skill-prompt-mentions__mention"
                  appendSpaceOnAdd
                  renderSuggestion={(entry) => {
                    const row = entry as MentionSuggestion;
                    const isHostTool = row.kind === 'hostTool';
                    return (
                      <div className={styles.suggestionItem}>
                        <span
                          className={`${styles.suggestionIcon} ${isHostTool ? styles.suggestionIconHost : ''}`.trim()}
                          aria-hidden
                        >
                          {isHostTool ? <DesktopOutlined /> : <ToolOutlined />}
                        </span>
                        <div className={styles.suggestionBody}>
                          <span className={styles.suggestionTitle}>
                            {row.display}
                            <Tag
                              className={styles.suggestionKindTag}
                              color={isHostTool ? 'purple' : 'blue'}
                            >
                              {intl.formatMessage({
                                id: isHostTool
                                  ? 'skill.promptMention.kind.hostTool'
                                  : 'skill.promptMention.kind.httpTool',
                              })}
                            </Tag>
                          </span>
                          {row.kind === 'tool' && (row.method || row.path) ? (
                            <span className={styles.suggestionMeta}>
                              {row.method ? (
                                <span className={styles.suggestionMethod}>
                                  {row.method}
                                </span>
                              ) : null}
                              {row.path ?? ''}
                            </span>
                          ) : row.kind === 'hostTool' ? (
                            <span className={styles.suggestionMeta}>
                              {row.pageScope
                                ? row.pageScope
                                : intl.formatMessage({
                                    id: 'hostTool.pageScope.generic',
                                  })}
                            </span>
                          ) : row.description ? (
                            <span className={styles.suggestionMeta}>
                              {row.description}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  }}
                />
              </MentionsInput>
            </div>
          </div>
        ) : (
          <div className={styles.composerDisabledBody}>{disabledMessage}</div>
        )}
      </div>
    </div>
  );
};

export default SkillPromptMentionEditor;
