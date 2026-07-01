import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import type { WorkflowActionKind } from '@/types/workflow';
import { useIntl } from '@umijs/max';
import { Alert, Form, Select, Switch } from 'antd';
import type { FormInstance } from 'antd/es/form';
import {
  buildHostToolSelectOptions,
  buildToolSelectOptions,
  workflowAssetSelectProps,
} from './workflowAssetSelectOptions';
import { defaultInputForAction } from '../workflowShared';

export type WorkflowNodeInputFormValues = {
  materialize?: boolean;
  toolId?: number;
  completeWhen?: 'first_success' | 'fetch_all_pages';
  hostToolId?: number;
  stream?: boolean;
  mode?: string;
  confirmKind?: 'mutation' | 'generic';
};

type WorkflowNodeInputFieldsProps = {
  action: WorkflowActionKind;
  tools: Tool[];
  hostTools: HostTool[];
  toolsLoading?: boolean;
  disabled?: boolean;
};

export function resetNodeInputFields(
  form: FormInstance,
  action: WorkflowActionKind,
): void {
  const defaults = defaultInputForAction(action);
  form.setFieldsValue({
    materialize: defaults.materialize as boolean | undefined,
    toolId: defaults.toolId as number | undefined,
    completeWhen: defaults.completeWhen as
      | 'first_success'
      | 'fetch_all_pages'
      | undefined,
    hostToolId: defaults.hostToolId as number | undefined,
    stream: defaults.stream as boolean | undefined,
    mode: defaults.mode as string | undefined,
    confirmKind: defaults.confirmKind as 'mutation' | 'generic' | undefined,
  });
}

export function nodeInputFromFormValues(
  action: WorkflowActionKind,
  values: WorkflowNodeInputFormValues,
): Record<string, unknown> {
  switch (action) {
    case 'load_page_context':
      return { materialize: values.materialize ?? true };
    case 'fetch_data':
      return {
        ...(values.toolId ? { toolId: values.toolId } : {}),
        completeWhen: values.completeWhen ?? 'first_success',
      };
    case 'generate_and_push':
      return {
        ...(values.hostToolId ? { hostToolId: values.hostToolId } : {}),
        stream: values.stream ?? true,
      };
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
    toolId:
      typeof input.toolId === 'number' && input.toolId > 0
        ? input.toolId
        : undefined,
    completeWhen:
      input.completeWhen === 'fetch_all_pages'
        ? 'fetch_all_pages'
        : 'first_success',
    hostToolId:
      typeof input.hostToolId === 'number' && input.hostToolId > 0
        ? input.hostToolId
        : undefined,
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

    case 'fetch_data':
      return (
        <>
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

    case 'generate_and_push':
      return (
        <>
          <Form.Item
            name="hostToolId"
            label={intl.formatMessage({ id: 'workflow.nodeInput.hostToolId' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'workflow.nodeInput.hostToolIdRequired',
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
                id: 'workflow.nodeInput.hostToolPlaceholder',
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
