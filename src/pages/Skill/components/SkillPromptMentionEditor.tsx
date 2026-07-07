import { DesktopOutlined, ToolOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Switch, Tag } from 'antd';
import { useMemo } from 'react';
import {
  Mention,
  MentionsInput,
  type SuggestionDataItem,
} from 'react-mentions';
import type {
  SkillHostToolTabKey,
  SkillHostToolTabRow,
} from '../skillHostTools';
import type {
  SkillPromptHostToolOption,
  SkillPromptToolOption,
} from '../skillPromptMention';
import { buildUnifiedMentionData } from '../skillPromptMention';
import type { SkillToolRow } from '../useSkillDetail';
import SkillMentionedHostToolsConfig from './SkillMentionedHostToolsConfig';
import styles from './SkillPromptMentionEditor.module.scss';

type SkillPromptMentionEditorProps = {
  value: string;
  onChange: (value: string) => void;
  tools: SkillPromptToolOption[];
  hostTools: SkillPromptHostToolOption[];
  boundToolIds: number[];
  boundHostToolIds: number[];
  toolRows?: SkillToolRow[];
  selectedToolIds?: number[];
  mutationHostToolRows?: SkillHostToolTabRow[];
  planHostToolRows?: SkillHostToolTabRow[];
  disabled?: boolean;
  saving?: boolean;
  placeholder?: string;
  compact?: boolean;
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

type MentionSuggestion = SuggestionDataItem & {
  kind: 'tool' | 'hostTool';
  description?: string;
  method?: string;
  path?: string;
  pageScope?: string | null;
};

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

const SkillPromptMentionEditor: React.FC<SkillPromptMentionEditorProps> = ({
  value,
  onChange,
  tools,
  hostTools,
  boundToolIds,
  boundHostToolIds,
  toolRows = [],
  selectedToolIds = [],
  mutationHostToolRows = [],
  planHostToolRows = [],
  disabled = false,
  saving = false,
  placeholder,
  compact = false,
  onToolSelectionChange,
  onToolRequiredChange,
  onHostToolRowChange,
}) => {
  const intl = useIntl();
  const showToolsAside =
    !compact && Boolean(onToolSelectionChange && onHostToolRowChange);

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

  const toggleHttpTool = (toolId: number) => {
    if (!onToolSelectionChange) {
      return;
    }
    const selected = selectedToolIds.includes(toolId);
    onToolSelectionChange(
      selected
        ? selectedToolIds.filter((id) => id !== toolId)
        : [...selectedToolIds, toolId],
    );
  };

  const toggleHostTool = (hostToolId: number) => {
    if (!onHostToolRowChange) {
      return;
    }
    const enabled = boundHostToolIds.includes(hostToolId);
    onHostToolRowChange('mutation', hostToolId, { enabled: !enabled });
  };

  const getHostToolRequired = (hostToolId: number) => {
    const mutationRow = mutationHostToolRows.find(
      (row) => row.hostToolId === hostToolId && row.enabled,
    );
    if (mutationRow) {
      return mutationRow.isRequired;
    }
    const planRow = planHostToolRows.find(
      (row) => row.hostToolId === hostToolId && row.enabled,
    );
    return planRow?.isRequired ?? false;
  };

  const setHostToolRequired = (hostToolId: number, isRequired: boolean) => {
    if (!onHostToolRowChange) {
      return;
    }
    const mutationRow = mutationHostToolRows.find(
      (row) => row.hostToolId === hostToolId && row.enabled,
    );
    if (mutationRow) {
      onHostToolRowChange('mutation', hostToolId, { isRequired });
      return;
    }
    const planRow = planHostToolRows.find(
      (row) => row.hostToolId === hostToolId && row.enabled,
    );
    if (planRow) {
      onHostToolRowChange('plan', hostToolId, { isRequired });
    }
  };

  const httpToolRequiredMap = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const row of toolRows) {
      map.set(row.toolId, row.isRequired);
    }
    return map;
  }, [toolRows]);

  const hasAvailableTools = tools.length > 0 || hostTools.length > 0;

  const renderToolsAside = () => {
    if (!showToolsAside) {
      return null;
    }

    return (
      <aside className={styles.toolsAside}>
        <h4 className={styles.toolsAsideTitle}>
          {intl.formatMessage({ id: 'skill.promptMention.sidePanelAvailable' })}
        </h4>
        {!hasAvailableTools ? (
          <p className={styles.toolsAsideEmpty}>
            {intl.formatMessage({ id: 'skill.promptMention.noTools' })}
          </p>
        ) : (
          <ul className={styles.toolsAsideList}>
            {tools.map((tool) => {
              const selected = selectedToolIds.includes(tool.toolId);
              const isRequired =
                httpToolRequiredMap.get(tool.toolId) ?? false;
              return (
                <li key={`tool-${tool.toolId}`}>
                  <div
                    className={
                      selected
                        ? styles.toolsAsideItemSelected
                        : styles.toolsAsideItem
                    }
                    onClick={() => toggleHttpTool(tool.toolId)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleHttpTool(tool.toolId);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span className={styles.toolsAsideItemIcon} aria-hidden>
                      <ToolOutlined />
                    </span>
                    <div className={styles.toolsAsideItemBody}>
                      <span className={styles.toolsAsideItemName}>
                        {tool.name}
                      </span>
                      {tool.method || tool.path ? (
                        <span className={styles.toolsAsideItemMeta}>
                          {tool.method ? `${tool.method} ` : ''}
                          {tool.path ?? ''}
                        </span>
                      ) : null}
                      <span className={styles.toolsAsideItemTag}>
                        {intl.formatMessage({
                          id: 'skill.promptMention.kind.httpTool',
                        })}
                      </span>
                      {selected ? (
                        <label
                          className={styles.toolsAsideItemRequired}
                          onClick={stopRowClick}
                        >
                          <span>
                            {intl.formatMessage({
                              id: 'skill.tools.column.required',
                            })}
                          </span>
                          <Switch
                            size="small"
                            disabled={disabled || saving}
                            checked={isRequired}
                            onChange={(checked) =>
                              onToolRequiredChange?.(tool.toolId, checked)
                            }
                          />
                        </label>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
            {hostTools.length > 0 && tools.length > 0 ? (
              <li>
                <p className={styles.toolsAsideSubtitle}>
                  {intl.formatMessage({
                    id: 'skill.promptMention.kind.hostTool',
                  })}
                </p>
              </li>
            ) : null}
            {hostTools.map((hostTool) => {
              const selected = boundHostToolIds.includes(hostTool.hostToolId);
              const isRequired = getHostToolRequired(hostTool.hostToolId);
              return (
                <li key={`host-${hostTool.hostToolId}`}>
                  <div
                    className={
                      selected
                        ? styles.toolsAsideItemSelectedHost
                        : styles.toolsAsideItemHost
                    }
                    onClick={() => toggleHostTool(hostTool.hostToolId)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleHostTool(hostTool.hostToolId);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span
                      className={styles.toolsAsideItemIconHost}
                      aria-hidden
                    >
                      <DesktopOutlined />
                    </span>
                    <div className={styles.toolsAsideItemBody}>
                      <span className={styles.toolsAsideItemName}>
                        {hostTool.name}
                      </span>
                      <span className={styles.toolsAsideItemMeta}>
                        {hostTool.pageScope
                          ? hostTool.pageScope
                          : intl.formatMessage({
                              id: 'hostTool.pageScope.generic',
                            })}
                      </span>
                      <span className={styles.toolsAsideItemTagHost}>
                        {intl.formatMessage({
                          id: 'skill.promptMention.kind.hostTool',
                        })}
                      </span>
                      {selected ? (
                        <label
                          className={styles.toolsAsideItemRequiredHost}
                          onClick={stopRowClick}
                        >
                          <span>
                            {intl.formatMessage({
                              id: 'skill.tools.column.required',
                            })}
                          </span>
                          <Switch
                            size="small"
                            disabled={disabled || saving}
                            checked={isRequired}
                            onChange={(checked) =>
                              setHostToolRequired(hostTool.hostToolId, checked)
                            }
                          />
                        </label>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    );
  };

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
          <div
            className={
              showToolsAside ? styles.composerBody : styles.composerBodySingle
            }
          >
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
            {renderToolsAside()}
          </div>
        ) : (
          <div className={styles.composerDisabledBody}>{disabledMessage}</div>
        )}
      </div>
      {showToolsAside && boundHostToolIds.length > 0 && onHostToolRowChange ? (
        <SkillMentionedHostToolsConfig
          mutationRows={mutationHostToolRows}
          planRows={planHostToolRows}
          selectedHostToolIds={boundHostToolIds}
          saving={saving}
          onRowChange={onHostToolRowChange}
        />
      ) : null}
    </div>
  );
};

export default SkillPromptMentionEditor;
