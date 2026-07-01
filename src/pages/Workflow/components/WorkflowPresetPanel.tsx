import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import type {
  WorkflowPresetCatalogEntry,
  WorkflowPresetConfig,
  WorkflowPresetObjectiveConfig,
} from '@/types/workflow';
import { useIntl } from '@umijs/max';
import { Alert, Collapse, Input, Select, Switch } from 'antd';
import {
  buildPresetConfigPayload,
  catalogEntryForPreset,
  defaultPresetForProfile,
  emptyPresetConfig,
  filterWriteToolCandidates,
  inferDeliverableForPreset,
  isMutationPreset,
  isPageContextMutationPreset,
  objectiveKeysForCatalogEntry,
  validatePresetForm,
  type WorkflowConfigMode,
  type WorkflowPresetFormState,
} from '../workflowPreset';
import {
  buildHostToolSelectOptions,
  buildToolSelectOptions,
  workflowAssetSelectProps,
} from './workflowAssetSelectOptions';
import styles from '../index.module.scss';

type WorkflowPresetPanelProps = {
  profile: string;
  value: WorkflowPresetFormState;
  catalog: WorkflowPresetCatalogEntry[];
  catalogLoading?: boolean;
  tools: Tool[];
  hostTools: HostTool[];
  toolsLoading?: boolean;
  disabled?: boolean;
  onChange: (value: WorkflowPresetFormState) => void;
};

const WorkflowPresetPanel: React.FC<WorkflowPresetPanelProps> = ({
  profile,
  value,
  catalog,
  catalogLoading = false,
  tools,
  hostTools,
  toolsLoading = false,
  disabled = false,
  onChange,
}) => {
  const intl = useIntl();
  const entry = catalogEntryForPreset(catalog, value.preset);
  const objectiveKeys = entry ? objectiveKeysForCatalogEntry(entry) : [];
  const visibleObjectiveKeys = objectiveKeys.filter(
    (key) => key !== 'fetch' || value.config.readToolId,
  );
  const writeToolOptions = buildToolSelectOptions(filterWriteToolCandidates(tools));

  const patchConfig = (patch: Partial<WorkflowPresetConfig>) => {
    onChange({
      ...value,
      config: { ...value.config, ...patch },
    });
  };

  const patchObjective = (key: keyof WorkflowPresetObjectiveConfig, text: string) => {
    onChange({
      ...value,
      config: {
        ...value.config,
        objectives: {
          ...value.config.objectives,
          [key]: text,
        },
      },
    });
  };

  const needsReadTool =
    entry?.requiredConfig.includes('readToolId') ||
    entry?.optionalConfig.includes('readToolId');
  const needsWriteTool =
    entry?.requiredConfig.includes('writeToolId') ||
    entry?.optionalConfig.includes('writeToolId');
  const needsHostTool =
    entry?.requiredConfig.includes('hostToolId') ||
    entry?.optionalConfig.includes('hostToolId');

  const resolvePresetLabel = (kind: string, apiLabel: string) =>
    apiLabel.trim() ||
    intl.formatMessage({
      id: `workflow.preset.kind.${kind}`,
      defaultMessage: kind,
    });

  const resolvePresetDescription = (kind: string, apiDesc: string) =>
    apiDesc.trim() ||
    intl.formatMessage({
      id: `workflow.preset.desc.${kind}`,
      defaultMessage: '',
    });

  return (
    <div className={styles.workflowPresetPanel}>
      <p className={styles.workflowPresetHint}>
        {intl.formatMessage({ id: 'workflow.preset.hint' })}
      </p>

      <div className={styles.workflowPresetGrid}>
        {catalog.map((item) => {
          const active = value.preset === item.kind;
          return (
            <button
              key={item.kind}
              type="button"
              disabled={disabled || catalogLoading}
              className={`${styles.workflowPresetCard} ${active ? styles.workflowPresetCardActive : ''}`.trim()}
              onClick={() =>
                onChange({
                  preset: item.kind,
                  config: value.config,
                })
              }
            >
              <span className={styles.workflowPresetCardTitle}>
                {resolvePresetLabel(item.kind, item.label)}
              </span>
              <span className={styles.workflowPresetCardDesc}>
                {resolvePresetDescription(item.kind, item.description)}
              </span>
              <span className={styles.workflowPresetCardPipeline}>
                {item.expandedActions.join(' → ')}
              </span>
            </button>
          );
        })}
      </div>

      {entry ? (
        <div className={styles.workflowPresetForm}>
          {isPageContextMutationPreset(value.preset) ? (
            <Alert
              type="info"
              showIcon
              className={styles.workflowPresetScenarioAlert}
              message={intl.formatMessage({
                id: 'workflow.preset.pageContextMutationSubmit.hint',
              })}
            />
          ) : null}
          {isMutationPreset(value.preset) ? (
            <Alert
              type="warning"
              showIcon
              className={styles.workflowPresetScenarioAlert}
              message={intl.formatMessage({
                id: 'workflow.preset.mutationNoDuplicateConfirm',
              })}
            />
          ) : null}
          <div className={styles.workflowPresetBindings}>
            {needsHostTool ? (
              <div className={styles.workflowPresetField}>
                <label className={styles.workflowFieldLabel}>
                  {intl.formatMessage({ id: 'workflow.preset.hostToolId' })}
                  {entry.requiredConfig.includes('hostToolId') ? ' *' : ''}
                </label>
                <Select
                  {...workflowAssetSelectProps}
                  className="app-input w-full"
                  loading={toolsLoading}
                  disabled={disabled}
                  placeholder={intl.formatMessage({
                    id: 'workflow.nodeInput.hostToolPlaceholder',
                  })}
                  value={value.config.hostToolId}
                  options={buildHostToolSelectOptions(hostTools)}
                  onChange={(hostToolId) =>
                    patchConfig({
                      hostToolId: typeof hostToolId === 'number' ? hostToolId : undefined,
                    })
                  }
                />
              </div>
            ) : null}

            {needsReadTool ? (
              <div className={styles.workflowPresetField}>
                <label className={styles.workflowFieldLabel}>
                  {intl.formatMessage({ id: 'workflow.preset.readToolId' })}
                  {entry.requiredConfig.includes('readToolId') ? ' *' : ''}
                </label>
                <Select
                  {...workflowAssetSelectProps}
                  allowClear={!entry.requiredConfig.includes('readToolId')}
                  className="app-input w-full"
                  loading={toolsLoading}
                  disabled={disabled}
                  placeholder={intl.formatMessage({
                    id: 'workflow.nodeInput.toolPlaceholder',
                  })}
                  value={value.config.readToolId}
                  options={buildToolSelectOptions(tools)}
                  onChange={(readToolId) =>
                    patchConfig({
                      readToolId: typeof readToolId === 'number' ? readToolId : undefined,
                    })
                  }
                />
              </div>
            ) : null}

            {needsWriteTool ? (
              <div className={styles.workflowPresetField}>
                <label className={styles.workflowFieldLabel}>
                  {intl.formatMessage({ id: 'workflow.preset.writeToolId' })}
                  {entry.requiredConfig.includes('writeToolId') ? ' *' : ''}
                </label>
                <Select
                  {...workflowAssetSelectProps}
                  className="app-input w-full"
                  loading={toolsLoading}
                  disabled={disabled}
                  placeholder={intl.formatMessage({
                    id: 'workflow.nodeInput.toolPlaceholder',
                  })}
                  value={value.config.writeToolId}
                  options={writeToolOptions}
                  onChange={(writeToolId) =>
                    patchConfig({
                      writeToolId: typeof writeToolId === 'number' ? writeToolId : undefined,
                    })
                  }
                />
              </div>
            ) : null}
          </div>

          <Collapse
            bordered={false}
            className="bg-transparent"
            items={[
              {
                key: 'advanced',
                label: intl.formatMessage({ id: 'workflow.preset.advanced' }),
                children: (
                  <div className={styles.workflowPresetAdvanced}>
                    {entry.optionalConfig.includes('fetchCompleteWhen') ? (
                      <div className={styles.workflowPresetField}>
                        <label className={styles.workflowFieldLabel}>
                          {intl.formatMessage({ id: 'workflow.nodeInput.completeWhen' })}
                        </label>
                        <Select
                          className="app-input w-full"
                          disabled={disabled}
                          value={value.config.fetchCompleteWhen ?? 'first_success'}
                          options={[
                            {
                              value: 'first_success',
                              label: intl.formatMessage({
                                id: 'workflow.nodeInput.completeWhen.first_success',
                              }),
                            },
                            {
                              value: 'fetch_all_pages',
                              label: intl.formatMessage({
                                id: 'workflow.nodeInput.completeWhen.fetch_all_pages',
                              }),
                            },
                          ]}
                          onChange={(next) => patchConfig({ fetchCompleteWhen: next })}
                        />
                      </div>
                    ) : null}

                    {entry.optionalConfig.includes('summarizeMode') ? (
                      <div className={styles.workflowPresetField}>
                        <label className={styles.workflowFieldLabel}>
                          {intl.formatMessage({ id: 'workflow.nodeInput.summarizeMode' })}
                        </label>
                        <Select
                          className="app-input w-full"
                          disabled={disabled}
                          value={value.config.summarizeMode ?? 'final'}
                          options={['brief', 'detailed', 'final'].map((mode) => ({
                            value: mode,
                            label: intl.formatMessage({
                              id: `workflow.nodeInput.summarizeMode.${mode}`,
                            }),
                          }))}
                          onChange={(next) => patchConfig({ summarizeMode: next })}
                        />
                      </div>
                    ) : null}

                    {entry.optionalConfig.includes('presentMode') ? (
                      <div className={styles.workflowPresetField}>
                        <label className={styles.workflowFieldLabel}>
                          {intl.formatMessage({ id: 'workflow.nodeInput.presentMode' })}
                        </label>
                        <Select
                          className="app-input w-full"
                          disabled={disabled}
                          value={value.config.presentMode ?? 'brief'}
                          options={['brief', 'detailed'].map((mode) => ({
                            value: mode,
                            label: intl.formatMessage({
                              id: `workflow.nodeInput.presentMode.${mode}`,
                            }),
                          }))}
                          onChange={(next) => patchConfig({ presentMode: next })}
                        />
                      </div>
                    ) : null}

                    {entry.optionalConfig.includes('pushStream') ? (
                      <div className={styles.workflowPresetSwitchRow}>
                        <span>{intl.formatMessage({ id: 'workflow.nodeInput.stream' })}</span>
                        <Switch
                          disabled={disabled}
                          checked={value.config.pushStream !== false}
                          onChange={(checked) => patchConfig({ pushStream: checked })}
                        />
                      </div>
                    ) : null}

                    {entry.optionalConfig.includes('materializePageContext') ? (
                      <div className={styles.workflowPresetSwitchRow}>
                        <span>
                          {intl.formatMessage({ id: 'workflow.nodeInput.materialize' })}
                        </span>
                        <Switch
                          disabled={disabled}
                          checked={value.config.materializePageContext !== false}
                          onChange={(checked) =>
                            patchConfig({ materializePageContext: checked })
                          }
                        />
                      </div>
                    ) : null}

                    {entry.optionalConfig.includes('confirmKind') ? (
                      <div className={styles.workflowPresetField}>
                        <label className={styles.workflowFieldLabel}>
                          {intl.formatMessage({ id: 'workflow.nodeInput.confirmKind' })}
                        </label>
                        <Select
                          className="app-input w-full"
                          disabled={disabled}
                          value={value.config.confirmKind ?? 'mutation'}
                          options={[
                            {
                              value: 'mutation',
                              label: intl.formatMessage({
                                id: 'workflow.nodeInput.confirmKind.mutation',
                              }),
                            },
                            {
                              value: 'generic',
                              label: intl.formatMessage({
                                id: 'workflow.nodeInput.confirmKind.generic',
                              }),
                            },
                          ]}
                          onChange={(next) => patchConfig({ confirmKind: next })}
                        />
                      </div>
                    ) : null}

                    {visibleObjectiveKeys.length > 0 ? (
                      <div className={styles.workflowPresetObjectives}>
                        <p className={styles.workflowPresetObjectivesHint}>
                          {intl.formatMessage({ id: 'workflow.preset.objectivesHint' })}
                        </p>
                        {visibleObjectiveKeys.map((key) => (
                          <div key={key} className={styles.workflowPresetField}>
                            <label className={styles.workflowFieldLabel}>
                              {intl.formatMessage({
                                id: `workflow.preset.objective.${key}`,
                              })}
                            </label>
                            <Input.TextArea
                              className="app-input"
                              disabled={disabled}
                              autoSize={{ minRows: 1, maxRows: 3 }}
                              value={value.config.objectives?.[key] ?? ''}
                              onChange={(event) => patchObjective(key, event.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        </div>
      ) : (
        <p className={styles.workflowPresetEmpty}>
          {intl.formatMessage(
            { id: 'workflow.preset.emptyForProfile' },
            { profile: intl.formatMessage({ id: `workflow.profile.${profile}` }) },
          )}
        </p>
      )}
    </div>
  );
};

export default WorkflowPresetPanel;
