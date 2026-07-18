import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import type {
  WorkflowActionKind,
  WorkflowEdge,
  WorkflowNodeDef,
} from '@/types/workflow';
import { useIntl } from '@umijs/max';
import { Button, Drawer, Form, Input, Select } from 'antd';
import { useEffect, useMemo } from 'react';
import { actionsGroupedByPhase } from '../workflowNodePhase';
import DetectCluesPanel from './DetectCluesPanel';
import WorkflowNodeInputFields, {
  formValuesFromNodeInput,
  nodeInputFromFormValues,
  resetNodeInputFields,
  type WorkflowNodeInputFormValues,
} from './WorkflowNodeInputFields';

type WorkflowNodePropertyDrawerProps = {
  open: boolean;
  node: WorkflowNodeDef | null;
  profile: string;
  nodes?: WorkflowNodeDef[];
  edges?: WorkflowEdge[];
  tools: Tool[];
  hostTools: HostTool[];
  toolsLoading?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSave: (node: WorkflowNodeDef) => void;
  onDelete?: (nodeId: string) => void;
  onGraphChange?: (next: {
    nodes: WorkflowNodeDef[];
    edges: WorkflowEdge[];
  }) => void;
};

type FormValues = {
  id: string;
  action: WorkflowActionKind;
  name: string;
  objective: string;
} & WorkflowNodeInputFormValues;

const WorkflowNodePropertyDrawer: React.FC<WorkflowNodePropertyDrawerProps> = ({
  open,
  node,
  profile,
  nodes = [],
  edges = [],
  tools,
  hostTools,
  toolsLoading = false,
  disabled = false,
  onClose,
  onSave,
  onDelete,
  onGraphChange,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm<FormValues>();
  const action = Form.useWatch('action', form);
  const phaseGroups = actionsGroupedByPhase(profile);

  const hasDetectAlready = useMemo(
    () =>
      nodes.some(
        (item) => item.action === 'detect_clues' && item.id !== node?.id,
      ),
    [node?.id, nodes],
  );

  const actionSelectOptions = phaseGroups.map((group) => ({
    label: intl.formatMessage({ id: `workflow.phase.${group.phase}` }),
    options: group.actions.map((actionKind) => ({
      value: actionKind,
      label: intl.formatMessage({
        id: `workflow.action.${actionKind}`,
        defaultMessage: actionKind,
      }),
      disabled: actionKind === 'detect_clues' && hasDetectAlready,
    })),
  }));

  useEffect(() => {
    if (!open || !node) {
      return;
    }
    form.setFieldsValue({
      id: node.id,
      action: node.action,
      name: node.name,
      objective: node.objective,
      ...formValuesFromNodeInput(node.action, node.input ?? {}),
    });
  }, [form, node, open]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const input = nodeInputFromFormValues(values.action, values);

    onSave({
      id: values.id.trim(),
      action: values.action,
      name: values.name,
      objective: values.objective,
      input,
    });
    onClose();
  };

  return (
    <Drawer
      title={intl.formatMessage({ id: 'workflow.flowCanvas.nodeDrawerTitle' })}
      open={open}
      width={action === 'detect_clues' ? 480 : 420}
      destroyOnHidden
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button
            danger
            disabled={disabled || !node || !onDelete}
            onClick={() => {
              if (node && onDelete) {
                onDelete(node.id);
                onClose();
              }
            }}
          >
            {intl.formatMessage({ id: 'common.delete' })}
          </Button>
          <div className="flex gap-2">
            <Button onClick={onClose}>
              {intl.formatMessage({ id: 'common.cancel' })}
            </Button>
            <Button
              type="primary"
              disabled={disabled}
              onClick={() => void handleSubmit()}
            >
              {intl.formatMessage({ id: 'common.save' })}
            </Button>
          </div>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="id"
          label={intl.formatMessage({ id: 'workflow.nodes.id' })}
          rules={[{ required: true }]}
        >
          <Input className="app-input" disabled={disabled} />
        </Form.Item>
        <Form.Item
          name="action"
          label={intl.formatMessage({ id: 'workflow.nodes.action' })}
          rules={[{ required: true }]}
        >
          <Select
            className="app-input w-full"
            disabled={disabled}
            options={actionSelectOptions}
            onChange={(nextAction: WorkflowActionKind) => {
              resetNodeInputFields(form, nextAction);
            }}
          />
        </Form.Item>
        <Form.Item
          name="name"
          label={intl.formatMessage({ id: 'workflow.nodes.name' })}
          rules={[
            {
              required: true,
              whitespace: true,
              message: intl.formatMessage({
                id: 'workflow.form.nodeNameRequired',
              }),
            },
          ]}
        >
          <Input className="app-input" disabled={disabled} />
        </Form.Item>
        <Form.Item
          name="objective"
          label={intl.formatMessage({ id: 'workflow.nodes.objective' })}
          rules={[
            {
              required: true,
              whitespace: true,
              message: intl.formatMessage({
                id: 'workflow.form.nodeObjectiveRequired',
              }),
            },
          ]}
        >
          <Input.TextArea
            className="app-input"
            disabled={disabled}
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
        </Form.Item>
        {action ? (
          <WorkflowNodeInputFields
            action={action}
            tools={tools}
            hostTools={hostTools}
            toolsLoading={toolsLoading}
            disabled={disabled}
          />
        ) : null}
        {action === 'detect_clues' && node && onGraphChange ? (
          <DetectCluesPanel
            detectId={node.id}
            nodes={nodes}
            edges={edges}
            disabled={disabled}
            onChange={onGraphChange}
          />
        ) : null}
      </Form>
    </Drawer>
  );
};

export default WorkflowNodePropertyDrawer;
