import {
  buildHostToolSelectOptions,
  buildToolSelectOptions,
  workflowAssetSelectProps,
} from '@/pages/Workflow/components/workflowAssetSelectOptions';
import {
  filterReadToolCandidates,
  filterWriteToolCandidates,
} from '@/pages/Workflow/workflowPreset';
import type { FlowProfile } from '@/types/flow';
import type { FlowIntentOperation, FlowIntentStep } from '@/types/flow-intent';
import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import { useIntl } from '@umijs/max';
import { Alert, Input, InputNumber, Select, Switch } from 'antd';
import { useMemo } from 'react';
import styles from '../../Workflow/index.module.scss';
import type { FlowBindEntry } from '../flowBindEntry';
import { flowAllowsMutate } from '../flowBindEntry';
import { resetStepForOperation } from '../flowIntentEditor';
import {
  FlowReadEvidenceHint,
  FlowReadScenarioGuide,
  FlowStepContextHint,
} from './FlowContextUsageHints';

const ADDABLE_OPERATIONS: FlowIntentOperation[] = [
  'read',
  'judge',
  'deliver',
  'mutate',
];

type IntentStepPropertyFormProps = {
  step: FlowIntentStep;
  profile: FlowProfile;
  bindEntry?: FlowBindEntry | null;
  tools: Tool[];
  hostTools: HostTool[];
  toolsLoading?: boolean;
  disabled?: boolean;
  onChange: (next: FlowIntentStep) => void;
};

const IntentStepPropertyForm: React.FC<IntentStepPropertyFormProps> = ({
  step,
  profile,
  bindEntry = null,
  tools,
  hostTools,
  toolsLoading = false,
  disabled = false,
  onChange,
}) => {
  const intl = useIntl();
  const allowsMutate = flowAllowsMutate(bindEntry);
  const toolOptions = buildToolSelectOptions(tools);
  const writeToolOptions = buildToolSelectOptions(
    filterWriteToolCandidates(tools),
  );
  const readToolOptions = buildToolSelectOptions(filterReadToolCandidates(tools));
  const mutatePrefetchToolOptions = readToolOptions;
  const hostOptions = buildHostToolSelectOptions(hostTools);

  const patch = (patchValue: Partial<FlowIntentStep>) => {
    onChange({ ...step, ...patchValue });
  };

  const changeOperation = (operation: FlowIntentOperation) => {
    if (operation === 'mutate' && !allowsMutate) {
      return;
    }
    if (operation === step.operation) {
      return;
    }
    onChange(resetStepForOperation(step, operation, profile, bindEntry));
  };

  const operationOptions = useMemo(
    () =>
      ADDABLE_OPERATIONS.map((operation) => ({
        value: operation,
        label: intl.formatMessage({
          id: `flow.intent.operation.${operation}`,
        }),
        disabled: operation === 'mutate' && !allowsMutate,
      })),
    [allowsMutate, intl],
  );

  return (
    <div className={styles.flowIntentPropsBody}>
      <div className={styles.workflowPresetField}>
        <label className={styles.workflowFieldLabel}>
          {intl.formatMessage({ id: 'flow.intent.field.id' })}
        </label>
        <Input className="app-input" value={step.id} disabled />
      </div>
      <div className={styles.workflowPresetField}>
        <label className={styles.workflowFieldLabel}>
          {intl.formatMessage({ id: 'flow.intent.field.name' })}
        </label>
        <Input
          className="app-input"
          disabled={disabled}
          value={step.name ?? ''}
          placeholder={intl.formatMessage({
            id: 'flow.intent.field.namePlaceholder',
          })}
          onChange={(event) => patch({ name: event.target.value })}
        />
      </div>
      <div className={styles.workflowPresetField}>
        <label className={styles.workflowFieldLabel}>
          {intl.formatMessage({ id: 'flow.intent.field.objective' })}
        </label>
        <Input.TextArea
          className="app-input"
          disabled={disabled}
          autoSize={{ minRows: 2, maxRows: 4 }}
          value={step.objective ?? ''}
          onChange={(event) => patch({ objective: event.target.value })}
        />
      </div>
      <div className={styles.workflowPresetField}>
        <label className={styles.workflowFieldLabel}>
          {intl.formatMessage({ id: 'flow.intent.field.operation' })}
        </label>
        <Select
          className="app-input w-full"
          disabled={disabled}
          value={step.operation}
          options={operationOptions}
          onChange={(operation) =>
            changeOperation(operation as FlowIntentOperation)
          }
        />
      </div>

      {step.operation !== 'read' ? (
        <FlowStepContextHint operation={step.operation} />
      ) : null}

      {step.operation === 'read' ? (
        <>
          <FlowReadEvidenceHint />
          <div className={styles.workflowPresetField}>
            <label className={styles.workflowFieldLabel}>
              {intl.formatMessage({ id: 'flow.intent.field.readToolIds' })}
            </label>
            <Select
              {...workflowAssetSelectProps}
              mode="multiple"
              className="app-input w-full"
              loading={toolsLoading}
              disabled={disabled}
              value={step.readToolIds ?? []}
              options={toolOptions}
              onChange={(ids) => {
                const readToolIds = (ids as number[]).filter(
                  (id) => typeof id === 'number' && id > 0,
                );
                patch({
                  readToolIds,
                  ...(readToolIds.length === 0
                    ? { completeWhen: undefined }
                    : {}),
                });
              }}
            />
          </div>
          {(step.readToolIds?.length ?? 0) > 0 ? (
            <div className={styles.workflowPresetField}>
              <label className={styles.workflowFieldLabel}>
                {intl.formatMessage({ id: 'flow.intent.field.completeWhen' })}
              </label>
              <Select
                className="app-input w-full"
                disabled={disabled}
                value={step.completeWhen ?? 'first_success'}
                options={[
                  {
                    value: 'first_success',
                    label: intl.formatMessage({
                      id: 'flow.intent.completeWhen.first_success',
                    }),
                  },
                  {
                    value: 'fetch_all_pages',
                    label: intl.formatMessage({
                      id: 'flow.intent.completeWhen.fetch_all_pages',
                    }),
                  },
                ]}
                onChange={(next) => patch({ completeWhen: next })}
              />
            </div>
          ) : null}
          <div className={styles.flowIntentImagesBlock}>
            <div className={styles.workflowPresetSwitchRow}>
              <span>
                {intl.formatMessage({ id: 'flow.intent.field.imagesEnabled' })}
              </span>
              <Switch
                disabled={disabled}
                checked={step.images?.enabled === true}
                onChange={(checked) => {
                  const hasReadTools = (step.readToolIds?.length ?? 0) > 0;
                  patch({
                    images: {
                      ...(step.images ?? { enabled: false }),
                      enabled: checked,
                      ...(checked && !step.images?.from
                        ? {
                            from: hasReadTools ? 'upstream' : 'page_context',
                          }
                        : {}),
                      ...(checked && step.images?.onFailure === undefined
                        ? { onFailure: 'degrade' as const }
                        : {}),
                    },
                  });
                }}
              />
            </div>
            {step.images?.enabled ? (
              <div className={`${styles.workflowPresetAdvanced} mt-3`}>
                <div className={styles.workflowPresetField}>
                  <label className={styles.workflowFieldLabel}>
                    {intl.formatMessage({ id: 'flow.intent.field.imagesFrom' })}
                  </label>
                  <Select
                    className="app-input w-full"
                    disabled={disabled}
                    value={step.images.from ?? 'page_context'}
                    options={[
                      {
                        value: 'page_context',
                        label: intl.formatMessage({
                          id: 'flow.intent.imagesFrom.page_context',
                        }),
                      },
                      {
                        value: 'upstream',
                        label: intl.formatMessage({
                          id: 'flow.intent.imagesFrom.upstream',
                        }),
                      },
                      {
                        value: 'all',
                        label: intl.formatMessage({
                          id: 'flow.intent.imagesFrom.all',
                        }),
                      },
                    ]}
                    onChange={(from) =>
                      patch({
                        images: { ...step.images!, from },
                      })
                    }
                  />
                </div>
                <div className={styles.workflowPresetField}>
                  <label className={styles.workflowFieldLabel}>
                    {intl.formatMessage({ id: 'flow.intent.field.imagesMaxCells' })}
                  </label>
                  <InputNumber
                    className="app-input w-full"
                    min={1}
                    max={6}
                    disabled={disabled}
                    value={step.images.maxCells ?? 4}
                    onChange={(maxCells) =>
                      patch({
                        images: {
                          ...step.images!,
                          maxCells:
                            typeof maxCells === 'number' ? maxCells : undefined,
                        },
                      })
                    }
                  />
                </div>
                <div className={styles.workflowPresetField}>
                  <label className={styles.workflowFieldLabel}>
                    {intl.formatMessage({ id: 'flow.intent.field.imagesCellPx' })}
                  </label>
                  <InputNumber
                    className="app-input w-full"
                    min={128}
                    max={1024}
                    step={64}
                    disabled={disabled}
                    value={step.images.cellPx ?? 256}
                    onChange={(cellPx) =>
                      patch({
                        images: {
                          ...step.images!,
                          cellPx:
                            typeof cellPx === 'number' ? cellPx : undefined,
                        },
                      })
                    }
                  />
                </div>
                <div className={styles.workflowPresetField}>
                  <label className={styles.workflowFieldLabel}>
                    {intl.formatMessage({
                      id: 'flow.intent.field.imagesOnFailure',
                    })}
                  </label>
                  <Select
                    className="app-input w-full"
                    disabled={disabled}
                    value={step.images.onFailure ?? 'degrade'}
                    options={[
                      {
                        value: 'degrade',
                        label: intl.formatMessage({
                          id: 'flow.intent.onFailure.degrade',
                        }),
                      },
                      {
                        value: 'fail',
                        label: intl.formatMessage({
                          id: 'flow.intent.onFailure.fail',
                        }),
                      },
                    ]}
                    onChange={(onFailure) =>
                      patch({
                        images: { ...step.images!, onFailure },
                      })
                    }
                  />
                </div>
                <div className={styles.workflowPresetField}>
                  <label className={styles.workflowFieldLabel}>
                    {intl.formatMessage({ id: 'flow.intent.field.imagesHint' })}
                  </label>
                  <Input.TextArea
                    className="app-input"
                    disabled={disabled}
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    value={step.images.hint ?? ''}
                    onChange={(event) =>
                      patch({
                        images: { ...step.images!, hint: event.target.value },
                      })
                    }
                  />
                </div>
              </div>
            ) : null}
          </div>
          <FlowReadScenarioGuide />
        </>
      ) : null}

      {step.operation === 'deliver' ? (
        <>
          <div className={styles.flowChannelGrid}>
            {(
              [
                { channel: 'speak' as const, id: 'speak' },
                { channel: 'fill' as const, id: 'fill' },
              ] as const
            ).map((item) => {
              const active = (step.channel ?? 'speak') === item.channel;
              return (
                <button
                  key={item.channel}
                  type="button"
                  disabled={disabled}
                  className={`${styles.flowChannelCard} ${active ? styles.flowChannelCardActive : ''}`.trim()}
                  onClick={() => patch({ channel: item.channel })}
                >
                  <span className={styles.flowChannelCardTitle}>
                    {intl.formatMessage({
                      id: `flow.intent.channel.${item.id}.title`,
                    })}
                  </span>
                </button>
              );
            })}
          </div>
          {(step.channel ?? 'speak') === 'fill' ? (
            <div className={styles.workflowPresetField}>
              <label className={styles.workflowFieldLabel}>
                {intl.formatMessage({
                  id: 'flow.intent.field.fillHostToolIds',
                })}
              </label>
              <Select
                {...workflowAssetSelectProps}
                mode="multiple"
                className="app-input w-full"
                loading={toolsLoading}
                disabled={disabled}
                value={step.fillHostToolIds ?? []}
                options={hostOptions}
                onChange={(ids) =>
                  patch({
                    fillHostToolIds: (ids as number[]).filter(
                      (id) => typeof id === 'number' && id > 0,
                    ),
                  })
                }
              />
            </div>
          ) : (
            <div className={styles.workflowPresetSwitchRow}>
              <span>
                {intl.formatMessage({ id: 'flow.intent.field.stream' })}
              </span>
              <Switch
                disabled={disabled}
                checked={step.stream !== false}
                onChange={(stream) => patch({ stream })}
              />
            </div>
          )}
        </>
      ) : null}

      {step.operation === 'mutate' ? (
        <>
          <Alert
            type="info"
            showIcon
            className="mb-3"
            message={intl.formatMessage({ id: 'flow.intent.mutateExpandHint' })}
          />
          <div className={styles.workflowPresetField}>
            <label className={styles.workflowFieldLabel}>
              {intl.formatMessage({ id: 'flow.intent.field.writeToolId' })}
            </label>
            <Select
              {...workflowAssetSelectProps}
              className="app-input w-full"
              loading={toolsLoading}
              disabled={disabled}
              value={step.writeToolId}
              options={writeToolOptions}
              onChange={(writeToolId) =>
                patch({
                  writeToolId:
                    typeof writeToolId === 'number' ? writeToolId : undefined,
                })
              }
            />
          </div>
          <div className={styles.workflowPresetField}>
            <label className={styles.workflowFieldLabel}>
              {intl.formatMessage({
                id: 'flow.intent.field.readToolIdsOptional',
              })}
            </label>
            <Select
              {...workflowAssetSelectProps}
              mode="multiple"
              className="app-input w-full"
              loading={toolsLoading}
              disabled={disabled}
              value={step.readToolIds ?? []}
              options={mutatePrefetchToolOptions}
              onChange={(ids) =>
                patch({
                  readToolIds: (ids as number[]).filter(
                    (id) => typeof id === 'number' && id > 0,
                  ),
                })
              }
            />
            <p className={styles.flowIntentFieldHint}>
              {intl.formatMessage({ id: 'flow.intent.mutateReadToolsHint' })}
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default IntentStepPropertyForm;
