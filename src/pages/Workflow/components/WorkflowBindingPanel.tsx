import { HostToolController_replaceSkillHostTools } from '@/services/host-tool';
import { SkillController_replaceTools } from '@/services/skill';
import {
  WorkflowController_findByAppClient,
  WorkflowController_findOne,
} from '@/services/workflow';
import type {
  WorkflowBindingValue,
  WorkflowListItem,
  WorkflowNodeDef,
} from '@/types/workflow';
import { formatApiErrorMessage } from '@/utils/api-error';
import { LinkOutlined } from '@ant-design/icons';
import { Link, useIntl } from '@umijs/max';
import { Alert, Button, Input, InputNumber, Select, Spin, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../index.module.scss';
import {
  compatibleProfilesForEntry,
  extractHostToolIdsFromNodes,
  extractToolIdsFromNodes,
  extractWriteToolIdsFromNodes,
  findPushNodeHostToolId,
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
      onPushHostToolResolved?.(null, false);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    void WorkflowController_findOne(value.workflowId)
      .then((detail) => {
        if (cancelled) {
          return;
        }
        setWorkflowNodes(detail.nodes);
        if (entry === 'page_action') {
          const pushHostToolId = findPushNodeHostToolId(detail.nodes);
          onPushHostToolResolved?.(
            pushHostToolId,
            hasGenerateAndPushNode(detail.nodes),
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWorkflowNodes([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [entry, onPushHostToolResolved, value.workflowId]);

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
            const next = options.find((item) => item.id === workflowId);
            onChange({
              workflowId: workflowId ?? null,
              workflowVersion: next?.version ?? null,
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
                  version: selected.version,
                  nodes: selected.nodeCount,
                },
              )}
            </span>
          }
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
        <InputNumber
          className="app-input w-full"
          disabled={disabled || !value.workflowId}
          min={1}
          placeholder={intl.formatMessage({
            id: 'workflow.binding.versionPlaceholder',
          })}
          value={value.workflowVersion ?? undefined}
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
