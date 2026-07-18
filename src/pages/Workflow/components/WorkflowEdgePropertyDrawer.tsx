import type { WorkflowEdge, WorkflowEdgeKind } from '@/types/workflow';
import { useIntl } from '@umijs/max';
import { Drawer, Form, Input, Select } from 'antd';
import { useEffect } from 'react';

export type WorkflowEdgeFormValues = {
  kind: WorkflowEdgeKind;
  clueKey?: string;
  clueDescription?: string;
};

type WorkflowEdgePropertyDrawerProps = {
  open: boolean;
  edge: WorkflowEdge | null;
  sourceIsDetect: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSave: (edge: WorkflowEdge) => void;
  onDelete?: (edgeId: string) => void;
};

const WorkflowEdgePropertyDrawer: React.FC<WorkflowEdgePropertyDrawerProps> = ({
  open,
  edge,
  sourceIsDetect,
  disabled = false,
  onClose,
  onSave,
  onDelete,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm<WorkflowEdgeFormValues>();
  const kind = Form.useWatch('kind', form) as WorkflowEdgeKind | undefined;

  useEffect(() => {
    if (!open || !edge) {
      return;
    }
    form.setFieldsValue({
      kind: edge.kind ?? 'always',
      clueKey: edge.clue?.key ?? '',
      clueDescription: edge.clue?.description ?? '',
    });
  }, [edge, form, open]);

  const kindOptions: { value: WorkflowEdgeKind; label: string }[] = sourceIsDetect
    ? [
        {
          value: 'clue',
          label: intl.formatMessage({ id: 'workflow.edge.kind.clue' }),
        },
        {
          value: 'default',
          label: intl.formatMessage({ id: 'workflow.edge.kind.default' }),
        },
      ]
    : [
        {
          value: 'always',
          label: intl.formatMessage({ id: 'workflow.edge.kind.always' }),
        },
      ];

  const handleOk = async () => {
    if (!edge) {
      return;
    }
    const values = await form.validateFields();
    const next: WorkflowEdge = {
      id: edge.id,
      from: edge.from,
      to: edge.to,
      kind: values.kind,
      clue:
        values.kind === 'clue'
          ? {
              key: values.clueKey?.trim() ?? '',
              description: values.clueDescription?.trim() ?? '',
            }
          : undefined,
    };
    onSave(next);
  };

  return (
    <Drawer
      title={intl.formatMessage({ id: 'workflow.edge.drawerTitle' })}
      open={open}
      width={420}
      destroyOnClose
      onClose={onClose}
      extra={
        <div className="flex items-center gap-2">
          {onDelete && edge && !disabled ? (
            <button
              type="button"
              className="app-button-secondary px-3 py-1.5 text-sm font-semibold text-red-600"
              onClick={() => onDelete(edge.id)}
            >
              {intl.formatMessage({ id: 'workflow.edge.delete' })}
            </button>
          ) : null}
          <button
            type="button"
            className="app-button-primary px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
            disabled={disabled}
            onClick={() => void handleOk()}
          >
            {intl.formatMessage({ id: 'workflow.edge.save' })}
          </button>
        </div>
      }
    >
      {edge ? (
        <Form form={form} layout="vertical" requiredMark={false} disabled={disabled}>
          <p className="mb-4 text-sm text-on-surface/55">
            {intl.formatMessage(
              { id: 'workflow.edge.path' },
              { from: edge.from, to: edge.to },
            )}
          </p>
          <Form.Item
            name="kind"
            label={intl.formatMessage({ id: 'workflow.edge.kind' })}
            rules={[{ required: true }]}
          >
            <Select className="app-input w-full" options={kindOptions} />
          </Form.Item>
          {kind === 'clue' ? (
            <>
              <Form.Item
                name="clueKey"
                label={intl.formatMessage({ id: 'workflow.edge.clueKey' })}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'workflow.edge.clueKeyRequired',
                    }),
                  },
                ]}
                extra={intl.formatMessage({ id: 'workflow.edge.clueKeyHint' })}
              >
                <Input className="app-input" placeholder="order_id" />
              </Form.Item>
              <Form.Item
                name="clueDescription"
                label={intl.formatMessage({
                  id: 'workflow.edge.clueDescription',
                })}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'workflow.edge.clueDescriptionRequired',
                    }),
                  },
                ]}
                extra={intl.formatMessage({
                  id: 'workflow.edge.clueDescriptionHint',
                })}
              >
                <Input.TextArea
                  className="app-input"
                  rows={3}
                  placeholder={intl.formatMessage({
                    id: 'workflow.edge.clueDescriptionPlaceholder',
                  })}
                />
              </Form.Item>
            </>
          ) : null}
          {sourceIsDetect ? (
            <p className="text-xs text-on-surface/50">
              {intl.formatMessage({ id: 'workflow.edge.detectHint' })}
            </p>
          ) : null}
        </Form>
      ) : null}
    </Drawer>
  );
};

export default WorkflowEdgePropertyDrawer;
