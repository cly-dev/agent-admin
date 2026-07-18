import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import type {
  SummarizeImagesFrom,
  SummarizeImagesOnFailure,
  WorkflowActionKind,
} from '@/types/workflow';
import { useIntl } from '@umijs/max';
import { Alert, Form, Input, InputNumber, Select, Switch } from 'antd';
import type { FormInstance } from 'antd/es/form';
import {
  buildHostToolSelectOptions,
  buildToolSelectOptions,
  workflowAssetSelectProps,
} from './workflowAssetSelectOptions';
import {
  defaultInputForAction,
  resolveNodeHostToolIds,
  resolveNodeToolIds,
} from '../workflowShared';

export type WorkflowNodeInputFormValues = {
  materialize?: boolean;
  hint?: string;
  toolId?: number;
  toolIds?: number[];
  completeWhen?: 'first_success' | 'fetch_all_pages';
  hostToolId?: number;
  hostToolIds?: number[];
  stream?: boolean;
  mode?: string;
  confirmKind?: 'mutation' | 'generic';
  imagesFrom?: SummarizeImagesFrom;
  maxCells?: number;
  cellPx?: number;
  onFailure?: SummarizeImagesOnFailure;
  cacheTtlSec?: number;
};

type WorkflowNodeInputFieldsProps = {
  action: WorkflowActionKind;
  tools: Tool[];
  hostTools: HostTool[];
  toolsLoading?: boolean;
  disabled?: boolean;
};

function coerceSummarizeImagesFrom(
  value: unknown,
  fallback: SummarizeImagesFrom = 'upstream',
): SummarizeImagesFrom {
  if (value === 'upstream' || value === 'page_context' || value === 'all') {
    return value;
  }
  return fallback;
}

function coerceSummarizeImagesOnFailure(
  value: unknown,
  fallback: SummarizeImagesOnFailure = 'degrade',
): SummarizeImagesOnFailure {
  if (value === 'degrade' || value === 'fail') {
    return value;
  }
  return fallback;
}

function coerceIntInRange(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  const rounded = Math.trunc(n);
  if (rounded < min || rounded > max) {
    return fallback;
  }
  return rounded;
}

export function resetNodeInputFields(
  form: FormInstance,
  action: WorkflowActionKind,
): void {
  const defaults = defaultInputForAction(action);
  form.setFieldsValue({
    materialize: defaults.materialize as boolean | undefined,
    hint: defaults.hint as string | undefined,
    toolId: defaults.toolId as number | undefined,
    toolIds: undefined,
    completeWhen: defaults.completeWhen as
      | 'first_success'
      | 'fetch_all_pages'
      | undefined,
    hostToolId: defaults.hostToolId as number | undefined,
    hostToolIds: undefined,
    stream: defaults.stream as boolean | undefined,
    mode: defaults.mode as string | undefined,
    confirmKind: defaults.confirmKind as 'mutation' | 'generic' | undefined,
    imagesFrom: defaults.from as SummarizeImagesFrom | undefined,
    maxCells: defaults.maxCells as number | undefined,
    cellPx: defaults.cellPx as number | undefined,
    onFailure: defaults.onFailure as SummarizeImagesOnFailure | undefined,
    cacheTtlSec: defaults.cacheTtlSec as number | undefined,
  });
}

export function nodeInputFromFormValues(
  action: WorkflowActionKind,
  values: WorkflowNodeInputFormValues,
): Record<string, unknown> {
  switch (action) {
    case 'load_page_context':
      return { materialize: values.materialize ?? true };
    case 'detect_clues':
      return values.hint?.trim() ? { hint: values.hint.trim() } : {};
    case 'fetch_data': {
      const toolIds = (values.toolIds ?? []).filter(
        (id) => typeof id === 'number' && id > 0,
      );
      return {
        ...(toolIds.length > 0 ? { toolIds } : {}),
        completeWhen: values.completeWhen ?? 'first_success',
      };
    }
    case 'summarize_images': {
      const hint = values.hint?.trim();
      return {
        from: coerceSummarizeImagesFrom(values.imagesFrom),
        maxCells: coerceIntInRange(values.maxCells, 1, 6, 4),
        cellPx: coerceIntInRange(values.cellPx, 128, 1024, 512),
        ...(hint ? { hint } : {}),
        onFailure: coerceSummarizeImagesOnFailure(values.onFailure),
        cacheTtlSec: coerceIntInRange(values.cacheTtlSec, 0, 604800, 86400),
      };
    }
    case 'generate_and_push': {
      const hostToolIds = (values.hostToolIds ?? []).filter(
        (id) => typeof id === 'number' && id > 0,
      );
      return {
        ...(hostToolIds.length > 0 ? { hostToolIds } : {}),
        stream: values.stream ?? true,
      };
    }
    case 'summarize':
      return { mode: values.mode ?? 'final' };
    case 'compose_mutation':
    case 'write_data':
      return values.toolId ? { toolId: values.toolId } : {};
    case 'present_mutation':
      return { mode: values.mode ?? 'brief' };
    case 'await_user_confirm':
      return { confirmKind: values.confirmKind ?? 'mutation' };
    default:
      return {};
  }
}

export function formValuesFromNodeInput(
  action: WorkflowActionKind,
  input: Record<string, unknown>,
): WorkflowNodeInputFormValues {
  const defaults = defaultInputForAction(action);
  return {
    materialize:
      typeof input.materialize === 'boolean'
        ? input.materialize
        : (defaults.materialize as boolean | undefined),
    hint: typeof input.hint === 'string' ? input.hint : '',
    toolId:
      typeof input.toolId === 'number' && input.toolId > 0
        ? input.toolId
        : undefined,
    toolIds: resolveNodeToolIds(input),
    completeWhen:
      input.completeWhen === 'fetch_all_pages'
        ? 'fetch_all_pages'
        : 'first_success',
    hostToolId:
      typeof input.hostToolId === 'number' && input.hostToolId > 0
        ? input.hostToolId
        : undefined,
    hostToolIds: resolveNodeHostToolIds(input),
    stream:
      typeof input.stream === 'boolean'
        ? input.stream
        : (defaults.stream as boolean | undefined),
    mode:
      typeof input.mode === 'string'
        ? input.mode
        : (defaults.mode as string | undefined),
    confirmKind:
      input.confirmKind === 'generic'
        ? 'generic'
        : 'mutation',
    imagesFrom: coerceSummarizeImagesFrom(
      input.from ?? defaults.from,
      'upstream',
    ),
    maxCells: coerceIntInRange(
      input.maxCells ?? defaults.maxCells,
      1,
      6,
      4,
    ),
    cellPx: coerceIntInRange(
      input.cellPx ?? defaults.cellPx,
      128,
      1024,
      512,
    ),
    onFailure: coerceSummarizeImagesOnFailure(
      input.onFailure ?? defaults.onFailure,
      'degrade',
    ),
    cacheTtlSec: coerceIntInRange(
      input.cacheTtlSec ?? defaults.cacheTtlSec,
      0,
      604800,
      86400,
    ),
  };
}

const WorkflowNodeInputFields: React.FC<WorkflowNodeInputFieldsProps> = ({
  action,
  tools,
  hostTools,
  toolsLoading = false,
  disabled = false,
}) => {
  const intl = useIntl();

  switch (action) {
    case 'load_page_context':
      return (
        <Form.Item
          name="materialize"
          label={intl.formatMessage({ id: 'workflow.nodeInput.materialize' })}
          valuePropName="checked"
        >
          <Switch disabled={disabled} />
        </Form.Item>
      );

    case 'detect_clues':
      // hint 与状态列表在 DetectCluesPanel 中统一排版
      return null;

    case 'fetch_data':
      return (
        <>
          <Form.Item
            name="toolIds"
            label={intl.formatMessage({ id: 'workflow.nodeInput.toolIds' })}
            extra={intl.formatMessage({
              id: 'workflow.nodeInput.toolIdsExtra',
            })}
            rules={[
              {
                validator: async (_, value: number[] | undefined) => {
                  if (!value || value.length === 0) {
                    throw new Error(
                      intl.formatMessage({
                        id: 'workflow.nodeInput.toolIdsRequired',
                      }),
                    );
                  }
                },
              },
            ]}
          >
            <Select
              {...workflowAssetSelectProps}
              mode="multiple"
              className="app-input w-full"
              loading={toolsLoading}
              disabled={disabled}
              placeholder={intl.formatMessage({
                id: 'workflow.nodeInput.toolIdsPlaceholder',
              })}
              options={buildToolSelectOptions(tools)}
            />
          </Form.Item>
          <Form.Item
            name="completeWhen"
            label={intl.formatMessage({ id: 'workflow.nodeInput.completeWhen' })}
          >
            <Select
              className="app-input w-full"
              disabled={disabled}
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
            />
          </Form.Item>
        </>
      );

    case 'summarize_images':
      return (
        <>
          <Alert
            type="info"
            showIcon
            className="mb-3"
            message={intl.formatMessage({
              id: 'workflow.nodeInput.summarizeImagesHelp',
            })}
          />
          <Form.Item
            name="imagesFrom"
            label={intl.formatMessage({
              id: 'workflow.nodeInput.summarizeImagesFrom',
            })}
            extra={intl.formatMessage({
              id: 'workflow.nodeInput.summarizeImagesFromExtra',
            })}
          >
            <Select
              className="app-input w-full"
              disabled={disabled}
              options={[
                {
                  value: 'upstream',
                  label: intl.formatMessage({
                    id: 'workflow.nodeInput.summarizeImagesFrom.upstream',
                  }),
                },
                {
                  value: 'page_context',
                  label: intl.formatMessage({
                    id: 'workflow.nodeInput.summarizeImagesFrom.page_context',
                  }),
                },
                {
                  value: 'all',
                  label: intl.formatMessage({
                    id: 'workflow.nodeInput.summarizeImagesFrom.all',
                  }),
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="maxCells"
            label={intl.formatMessage({
              id: 'workflow.nodeInput.summarizeImagesMaxCells',
            })}
            rules={[
              {
                type: 'number',
                min: 1,
                max: 6,
                message: intl.formatMessage({
                  id: 'workflow.nodeInput.summarizeImagesMaxCellsInvalid',
                }),
              },
            ]}
          >
            <InputNumber
              className="app-input w-full"
              min={1}
              max={6}
              precision={0}
              disabled={disabled}
            />
          </Form.Item>
          <Form.Item
            name="cellPx"
            label={intl.formatMessage({
              id: 'workflow.nodeInput.summarizeImagesCellPx',
            })}
            extra={intl.formatMessage({
              id: 'workflow.nodeInput.summarizeImagesCellPxExtra',
            })}
            rules={[
              {
                type: 'number',
                min: 128,
                max: 1024,
                message: intl.formatMessage({
                  id: 'workflow.nodeInput.summarizeImagesCellPxInvalid',
                }),
              },
            ]}
          >
            <InputNumber
              className="app-input w-full"
              min={128}
              max={1024}
              precision={0}
              disabled={disabled}
            />
          </Form.Item>
          <Form.Item
            name="hint"
            label={intl.formatMessage({
              id: 'workflow.nodeInput.summarizeImagesHint',
            })}
            extra={intl.formatMessage({
              id: 'workflow.nodeInput.summarizeImagesHintExtra',
            })}
          >
            <Input.TextArea
              className="app-input"
              rows={3}
              disabled={disabled}
              placeholder={intl.formatMessage({
                id: 'workflow.nodeInput.summarizeImagesHintPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="onFailure"
            label={intl.formatMessage({
              id: 'workflow.nodeInput.summarizeImagesOnFailure',
            })}
            extra={intl.formatMessage({
              id: 'workflow.nodeInput.summarizeImagesOnFailureExtra',
            })}
          >
            <Select
              className="app-input w-full"
              disabled={disabled}
              options={[
                {
                  value: 'degrade',
                  label: intl.formatMessage({
                    id: 'workflow.nodeInput.summarizeImagesOnFailure.degrade',
                  }),
                },
                {
                  value: 'fail',
                  label: intl.formatMessage({
                    id: 'workflow.nodeInput.summarizeImagesOnFailure.fail',
                  }),
                },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="cacheTtlSec"
            label={intl.formatMessage({
              id: 'workflow.nodeInput.summarizeImagesCacheTtl',
            })}
            extra={intl.formatMessage({
              id: 'workflow.nodeInput.summarizeImagesCacheTtlExtra',
            })}
            rules={[
              {
                type: 'number',
                min: 0,
                max: 604800,
                message: intl.formatMessage({
                  id: 'workflow.nodeInput.summarizeImagesCacheTtlInvalid',
                }),
              },
            ]}
          >
            <InputNumber
              className="app-input w-full"
              min={0}
              max={604800}
              precision={0}
              disabled={disabled}
            />
          </Form.Item>
        </>
      );

    case 'generate_and_push':
      return (
        <>
          <Form.Item
            name="hostToolIds"
            label={intl.formatMessage({ id: 'workflow.nodeInput.hostToolIds' })}
            extra={intl.formatMessage({
              id: 'workflow.nodeInput.hostToolIdsExtra',
            })}
            rules={[
              {
                validator: async (_, value: number[] | undefined) => {
                  if (!value || value.length === 0) {
                    throw new Error(
                      intl.formatMessage({
                        id: 'workflow.nodeInput.hostToolIdsRequired',
                      }),
                    );
                  }
                },
              },
            ]}
          >
            <Select
              {...workflowAssetSelectProps}
              mode="multiple"
              className="app-input w-full"
              loading={toolsLoading}
              disabled={disabled}
              placeholder={intl.formatMessage({
                id: 'workflow.nodeInput.hostToolIdsPlaceholder',
              })}
              options={buildHostToolSelectOptions(hostTools)}
            />
          </Form.Item>
          <Form.Item
            name="stream"
            label={intl.formatMessage({ id: 'workflow.nodeInput.stream' })}
            valuePropName="checked"
          >
            <Switch disabled={disabled} />
          </Form.Item>
        </>
      );

    case 'summarize':
      return (
        <Form.Item
          name="mode"
          label={intl.formatMessage({ id: 'workflow.nodeInput.summarizeMode' })}
        >
          <Select
            className="app-input w-full"
            disabled={disabled}
            options={['brief', 'detailed', 'draft', 'final'].map((value) => ({
              value,
              label: intl.formatMessage({
                id: `workflow.nodeInput.summarizeMode.${value}`,
              }),
            }))}
          />
        </Form.Item>
      );

    case 'compose_mutation':
    case 'write_data':
      return (
        <Form.Item
          name="toolId"
          label={intl.formatMessage({ id: 'workflow.nodeInput.toolId' })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'workflow.nodeInput.toolIdRequired',
              }),
            },
          ]}
        >
          <Select
            {...workflowAssetSelectProps}
            className="app-input w-full"
            loading={toolsLoading}
            disabled={disabled}
            placeholder={intl.formatMessage({
              id: 'workflow.nodeInput.toolPlaceholder',
            })}
            options={buildToolSelectOptions(tools)}
          />
        </Form.Item>
      );

    case 'present_mutation':
      return (
        <Form.Item
          name="mode"
          label={intl.formatMessage({ id: 'workflow.nodeInput.presentMode' })}
        >
          <Select
            className="app-input w-full"
            disabled={disabled}
            options={['brief', 'detailed'].map((value) => ({
              value,
              label: intl.formatMessage({
                id: `workflow.nodeInput.presentMode.${value}`,
              }),
            }))}
          />
        </Form.Item>
      );

    case 'await_user_confirm':
      return (
        <>
          <Alert
            type="info"
            showIcon
            className="mb-3"
            message={intl.formatMessage({
              id: 'workflow.nodeInput.awaitUserConfirmGateHint',
            })}
          />
          <Form.Item
            name="confirmKind"
            label={intl.formatMessage({ id: 'workflow.nodeInput.confirmKind' })}
          >
            <Select
              className="app-input w-full"
              disabled={disabled}
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
            />
          </Form.Item>
        </>
      );

    default:
      return null;
  }
};

export default WorkflowNodeInputFields;
