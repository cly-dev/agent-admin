import { HostToolController_replaceSkillHostTools } from '@/services/host-tool';
import { SkillController_replaceTools } from '@/services/skill';
import {
  WorkflowController_findByAppClient,
  WorkflowController_findOne,
  WorkflowController_getRevision,
  WorkflowController_listRevisions,
} from '@/services/workflow';
import type {
  WorkflowBindingValue,
  WorkflowListItem,
  WorkflowNodeDef,
  WorkflowRevisionSummary,
} from '@/types/workflow';
import { formatApiErrorMessage } from '@/utils/api-error';
import { LinkOutlined } from '@ant-design/icons';
import { Link, useIntl } from '@umijs/max';
import { Alert, Button, Input, Select, Spin, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../index.module.scss';
import {
  compatibleProfilesForEntry,
  extractHostToolIdsFromNodes,
  extractToolIdsFromNodes,
  extractWriteToolIdsFromNodes,
  findPushNodeHostToolId,
  formatWorkflowRevisionLabel,
  hasAwaitUserConfirmNode,
  hasGenerateAndPushNode,
  isPageContextMutationWorkflow,
  parseWorkflowOverridesJson,
  stringifyWorkflowOverrides,
} from '../workflowShared';

type WorkflowBindingPanelProps = {
  projectId?: number;
  entry: 'skill' | 'page_action';
  value: WorkflowBindingValue;
  disabled?: boolean;
  boundToolIds?: number[];
  boundHostToolIds?: number[];
  onChange: (value: WorkflowBindingValue) => void;
  onPushHostToolResolved?: (
    hostToolId: number | null,
    hasPushNode: boolean,
  ) => void;
  skillSync?: {
    skillId: number;
    currentToolIds: number[];
    currentHostToolIds: number[];
    onSynced: (toolIds: number[], hostToolIds: number[]) => void;
  };
  /** workflow-only：SkillTool 可选；overlay：须覆盖 Workflow 节点引用 */
  skillBindingMode?: 'workflow_only' | 'overlay';
};

const WorkflowBindingPanel: React.FC<WorkflowBindingPanelProps> = ({
  projectId,
  entry,
  value,
  disabled = false,
  boundToolIds = [],
  boundHostToolIds = [],
  onChange,
  onPushHostToolResolved,
  skillSync,
  skillBindingMode = 'workflow_only',
}) => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [syncingBindings, setSyncingBindings] = useState(false);
  const [options, setOptions] = useState<WorkflowListItem[]>([]);
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNodeDef[]>([]);
  const [revisionOptions, setRevisionOptions] = useState<
    WorkflowRevisionSummary[]
  >([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [overridesJson, setOverridesJson] = useState(() =>
    stringifyWorkflowOverrides(value.workflowOverrides ?? undefined),
  );

  const profileFilter = useMemo(
    () => compatibleProfilesForEntry(entry),
    [entry],
  );

  const loadOptions = useCallback(async () => {
    if (!projectId) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const result = await WorkflowController_findByAppClient(projectId, {
        page: 1,
        pageSize: 100,
        isActive: true,
      });
      setOptions(
        result.list.filter((item) =>
          profileFilter.includes(
            item.profile as (typeof profileFilter)[number],
          ),
        ),
      );
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [profileFilter, projectId]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    setOverridesJson(
      stringifyWorkflowOverrides(value.workflowOverrides ?? undefined),
    );
  }, [value.workflowOverrides]);

  const selected = options.find((item) => item.id === value.workflowId);

  useEffect(() => {
    if (!value.workflowId) {
      setWorkflowNodes([]);
      setRevisionOptions([]);
      onPushHostToolResolved?.(null, false);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setRevisionsLoading(true);

    const loadWorkflowContext = async () => {
      try {
        const [detail, revisions] = await Promise.all([
          WorkflowController_findOne(value.workflowId!),
          WorkflowController_listRevisions(value.workflowId!, {
            summary: true,
            limit: 100,
          }),
        ]);
        if (cancelled) {
          return;
        }
        setRevisionOptions(revisions);

        const pinnedVersion = value.workflowVersion;
        const nodes =
          pinnedVersion && pinnedVersion !== detail.version
            ? (
                await WorkflowController_getRevision(
                  value.workflowId!,
                  pinnedVersion,
                )
              ).nodes
            : detail.nodes;

        setWorkflowNodes(nodes);
        if (entry === 'page_action') {
          const pushHostToolId = findPushNodeHostToolId(nodes);
          onPushHostToolResolved?.(
            pushHostToolId,
            hasGenerateAndPushNode(nodes),
          );
        }
      } catch {
        if (!cancelled) {
          setWorkflowNodes([]);
          setRevisionOptions([]);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
          setRevisionsLoading(false);
        }
      }
    };

    void loadWorkflowContext();

    return () => {
      cancelled = true;
    };
  }, [entry, onPushHostToolResolved, value.workflowId, value.workflowVersion]);

  const requiredToolIds = useMemo(
    () => extractToolIdsFromNodes(workflowNodes),
    [workflowNodes],
  );
  const requiredHostToolIds = useMemo(
    () => extractHostToolIdsFromNodes(workflowNodes),
    [workflowNodes],
  );

  const missingToolIds = useMemo(
    () => requiredToolIds.filter((id) => !boundToolIds.includes(id)),
    [boundToolIds, requiredToolIds],
  );
  const missingHostToolIds = useMemo(
    () => requiredHostToolIds.filter((id) => !boundHostToolIds.includes(id)),
    [boundHostToolIds, requiredHostToolIds],
  );

  const writeToolIds = useMemo(
    () => extractWriteToolIdsFromNodes(workflowNodes),
    [workflowNodes],
  );
  const hasApprovalGate = useMemo(
    () => hasAwaitUserConfirmNode(workflowNodes),
    [workflowNodes],
  );
  const isPageContextMutation = useMemo(
    () => isPageContextMutationWorkflow(workflowNodes),
    [workflowNodes],
  );

  const canSyncSkillBindings =
    skillBindingMode === 'overlay' &&
    entry === 'skill' &&
    Boolean(skillSync?.skillId) &&
    (missingToolIds.length > 0 || missingHostToolIds.length > 0);

  const handleSyncSkillBindings = useCallback(async () => {
    if (!skillSync?.skillId) {
      return;
    }
    const nextToolIds = [
      ...new Set([...skillSync.currentToolIds, ...missingToolIds]),
    ];
    const nextHostToolIds = [
      ...new Set([...skillSync.currentHostToolIds, ...missingHostToolIds]),
    ];
    setSyncingBindings(true);
    try {
      if (missingToolIds.length > 0) {
        await SkillController_replaceTools(skillSync.skillId, {
          tools: nextToolIds.map((toolId) => ({ toolId, isRequired: true })),
        });
      }
      if (missingHostToolIds.length > 0) {
        await HostToolController_replaceSkillHostTools(skillSync.skillId, {
          tools: nextHostToolIds.map((hostToolId) => ({
            hostToolId,
            isRequired: true,
          })),
        });
      }
      skillSync.onSynced(nextToolIds, nextHostToolIds);
      message.success(
        intl.formatMessage({ id: 'workflow.binding.syncSuccess' }),
      );
    } catch (error: unknown) {
      message.error(
        formatApiErrorMessage(
          error,
          intl.formatMessage({ id: 'workflow.binding.syncFailed' }),
        ),
      );
    } finally {
      setSyncingBindings(false);
    }
  }, [intl, missingHostToolIds, missingToolIds, skillSync]);

  const pinnedRevision = revisionOptions.find(
    (item) => item.version === value.workflowVersion,
  );
  const isPinnedStale = Boolean(
    value.workflowVersion && pinnedRevision && !pinnedRevision.isCurrent,
  );

  const workflowOptions = options.map((item) => ({
    value: item.id,
    label: `${item.name} (${item.workflowKey}) v${item.version}`,
  }));

  return (
    <div className={styles.workflowBindingPanel}>
      <p className={styles.workflowBindingHint}>
        {intl.formatMessage({ id: 'workflow.binding.hint' })}
      </p>

      <div className={styles.workflowBindingField}>
        <label className={styles.workflowBindingLabel}>
          {intl.formatMessage({ id: 'workflow.binding.workflow' })}
        </label>
        <Select
          allowClear
          showSearch
          className="app-input"
          disabled={disabled || !projectId}
          loading={loading}
          placeholder={intl.formatMessage({
            id: 'workflow.binding.workflowPlaceholder',
          })}
          optionFilterProp="label"
          value={value.workflowId ?? undefined}
          options={workflowOptions}
          notFoundContent={loading ? <Spin size="small" /> : undefined}
          onChange={(workflowId) => {
            onChange({
              workflowId: workflowId ?? null,
              workflowVersion: null,
              workflowOverrides: value.workflowOverrides ?? null,
            });
          }}
        />
      </div>

      {selected ? (
        <Alert
          type="info"
          showIcon
          className={styles.workflowBindingAlert}
          message={
            <span>
              {intl.formatMessage(
                { id: 'workflow.binding.selectedMeta' },
                {
                  profile: intl.formatMessage({
                    id: `workflow.profile.${selected.profile}`,
                    defaultMessage: selected.profile,
                  }),
                  version: value.workflowVersion ?? selected.version,
                  nodes: selected.nodeCount,
                },
              )}
            </span>
          }
        />
      ) : null}

      {isPinnedStale && value.workflowVersion ? (
        <Alert
          type="warning"
          showIcon
          className={styles.workflowBindingAlert}
          message={intl.formatMessage(
            { id: 'workflow.binding.pinnedStale' },
            { version: value.workflowVersion },
          )}
        />
      ) : null}

      {value.workflowId && detailLoading ? (
        <div className={styles.workflowBindingLoading}>
          <Spin size="small" />
        </div>
      ) : null}

      {value.workflowId && !detailLoading && entry === 'page_action' ? (
        <>
          {findPushNodeHostToolId(workflowNodes) ? (
            <Alert
              type="info"
              showIcon
              className={styles.workflowBindingAlert}
              message={intl.formatMessage(
                { id: 'workflow.binding.pushHostToolRuntimeHint' },
                { hostToolId: findPushNodeHostToolId(workflowNodes) },
              )}
            />
          ) : null}
          {hasApprovalGate ? (
            <Alert
              type="info"
              showIcon
              className={styles.workflowBindingAlert}
              message={intl.formatMessage({
                id: 'workflow.binding.pageActionApprovalGateHint',
              })}
            />
          ) : null}
        </>
      ) : null}

      {value.workflowId && !detailLoading && entry === 'skill' ? (
        <>
          {skillBindingMode === 'workflow_only' ? (
            <Alert
              type="info"
              showIcon
              className={styles.workflowBindingAlert}
              message={intl.formatMessage({
                id: 'workflow.binding.skillWorkflowOnlyHint',
              })}
            />
          ) : null}
          {hasApprovalGate || writeToolIds.length > 0 ? (
            <Alert
              type="info"
              showIcon
              className={styles.workflowBindingAlert}
              message={intl.formatMessage(
                { id: 'workflow.binding.skillWritePermissionHint' },
                {
                  toolIds:
                    writeToolIds.length > 0
                      ? writeToolIds.join(', ')
                      : intl.formatMessage({
                          id: 'workflow.binding.writeToolsUnknown',
                        }),
                },
              )}
            />
          ) : null}
          {isPageContextMutation ? (
            <Alert
              type="info"
              showIcon
              className={styles.workflowBindingAlert}
              message={intl.formatMessage({
                id: 'workflow.binding.skillPageContextMutationHint',
              })}
            />
          ) : null}
          {skillBindingMode === 'overlay' && missingToolIds.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              className={styles.workflowBindingAlert}
              message={intl.formatMessage(
                { id: 'workflow.binding.missingSkillToolsOverlay' },
                { ids: missingToolIds.join(', ') },
              )}
            />
          ) : null}
          {skillBindingMode === 'overlay' && missingHostToolIds.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              className={styles.workflowBindingAlert}
              message={intl.formatMessage(
                { id: 'workflow.binding.missingSkillHostToolsOverlay' },
                { ids: missingHostToolIds.join(', ') },
              )}
            />
          ) : null}
          {skillBindingMode === 'overlay' &&
          missingToolIds.length === 0 &&
          missingHostToolIds.length === 0 &&
          requiredToolIds.length + requiredHostToolIds.length > 0 ? (
            <Alert
              type="success"
              showIcon
              className={styles.workflowBindingAlert}
              message={intl.formatMessage({
                id: 'workflow.binding.skillAligned',
              })}
            />
          ) : null}
          {canSyncSkillBindings ? (
            <div className={styles.workflowBindingSyncRow}>
              <Button
                type="primary"
                size="small"
                loading={syncingBindings}
                disabled={disabled || detailLoading}
                onClick={() => void handleSyncSkillBindings()}
              >
                {intl.formatMessage({
                  id: 'workflow.binding.syncSkillBindings',
                })}
              </Button>
              <span className={styles.workflowBindingFieldHint}>
                {intl.formatMessage({
                  id: 'workflow.binding.syncSkillBindingsHint',
                })}
              </span>
            </div>
          ) : null}
        </>
      ) : null}

      <div className={styles.workflowBindingField}>
        <label className={styles.workflowBindingLabel}>
          {intl.formatMessage({ id: 'workflow.binding.version' })}
        </label>
        <Select
          allowClear
          className="app-input"
          disabled={disabled || !value.workflowId}
          loading={revisionsLoading}
          placeholder={intl.formatMessage({
            id: 'workflow.binding.versionPlaceholder',
          })}
          value={value.workflowVersion ?? undefined}
          options={revisionOptions.map((item) => ({
            value: item.version,
            label: item.isCurrent
              ? intl.formatMessage(
                  { id: 'workflow.revision.optionCurrent' },
                  {
                    label: formatWorkflowRevisionLabel(
                      item.version,
                      item.changeNote,
                    ),
                  },
                )
              : formatWorkflowRevisionLabel(item.version, item.changeNote),
          }))}
          onChange={(next) =>
            onChange({
              ...value,
              workflowVersion: typeof next === 'number' ? next : null,
            })
          }
        />
        <p className={styles.workflowBindingFieldHint}>
          {intl.formatMessage({ id: 'workflow.binding.versionHint' })}
        </p>
      </div>

      <div className={styles.workflowBindingField}>
        <label className={styles.workflowBindingLabel}>
          {intl.formatMessage({ id: 'workflow.binding.overrides' })}
        </label>
        <Input.TextArea
          className="app-input font-mono text-xs"
          disabled={disabled || !value.workflowId}
          autoSize={{ minRows: 4, maxRows: 10 }}
          placeholder={intl.formatMessage({
            id: 'workflow.binding.overridesPlaceholder',
          })}
          value={overridesJson}
          onChange={(event) => {
            const nextJson = event.target.value;
            setOverridesJson(nextJson);
            const parsed = parseWorkflowOverridesJson(nextJson);
            if (nextJson.trim() && parsed === null) {
              return;
            }
            onChange({
              ...value,
              workflowOverrides: parsed ?? null,
            });
          }}
        />
      </div>

      <Link
        to="/workflow/assets"
        className={styles.workflowBindingLink}
        target="_blank"
      >
        <LinkOutlined />
        {intl.formatMessage({ id: 'workflow.binding.manageAssets' })}
      </Link>
    </div>
  );
};

export default WorkflowBindingPanel;
