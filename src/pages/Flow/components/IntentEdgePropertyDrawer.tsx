import type { FlowIntentEdge, FlowIntentStep } from '@/types/flow-intent';
import { FlowController_allocateStateKeys } from '@/services/flow';
import { useIntl } from '@umijs/max';
import { Alert, Drawer, Form, Input, Select, message } from 'antd';
import { useEffect, useState } from 'react';

export type IntentEdgeFormValues = {
  kind: 'always' | 'state' | 'default';
  stateLabel?: string;
  stateDescription?: string;
};

type IntentEdgePropertyDrawerProps = {
  open: boolean;
  edge: FlowIntentEdge | null;
  sourceStep: FlowIntentStep | null;
  /** 同 judge 是否已有其他 default 边（当前边除外） */
  hasOtherDefault?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSave: (edge: FlowIntentEdge) => void;
  onDelete?: (edgeId: string) => void;
};

const IntentEdgePropertyDrawer: React.FC<IntentEdgePropertyDrawerProps> = ({
  open,
  edge,
  sourceStep,
  hasOtherDefault = false,
  disabled = false,
  onClose,
  onSave,
  onDelete,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm<IntentEdgeFormValues>();
  const [allocating, setAllocating] = useState(false);
  const kind = Form.useWatch('kind', form);
  const sourceIsJudge = sourceStep?.operation === 'judge';

  useEffect(() => {
    if (!open || !edge) {
      return;
    }
    form.setFieldsValue({
      kind: edge.kind ?? (sourceIsJudge ? 'state' : 'always'),
      stateLabel: edge.uiLabel ?? '',
      stateDescription: edge.state?.description ?? '',
    });
  }, [edge, form, open, sourceIsJudge]);

  const kindOptions: {
    value: IntentEdgeFormValues['kind'];
    label: string;
    disabled?: boolean;
  }[] = sourceIsJudge
      ? [
          {
            value: 'state',
            label: intl.formatMessage({ id: 'flow.edge.kind.state' }),
          },
          {
            value: 'default',
            label: intl.formatMessage({ id: 'flow.edge.kind.default' }),
            disabled: hasOtherDefault && edge?.kind !== 'default',
          },
        ]
      : [
          {
            value: 'always',
            label: intl.formatMessage({ id: 'flow.edge.kind.always' }),
          },
        ];

  const allocateLabel = async (label: string): Promise<string | null> => {
    const trimmed = label.trim();
    if (!trimmed) {
      return null;
    }
    setAllocating(true);
    try {
      const keys = await FlowController_allocateStateKeys([trimmed]);
      return keys[0]?.trim() || trimmed;
    } catch {
      message.error(intl.formatMessage({ id: 'flow.edge.stateKeyFailed' }));
      return null;
    } finally {
      setAllocating(false);
    }
  };

  const handleOk = async () => {
    if (!edge) {
      return;
    }
    const values = await form.validateFields();

    if (values.kind === 'default' && hasOtherDefault && edge.kind !== 'default') {
      message.error(
        intl.formatMessage({ id: 'flow.edge.duplicateDefault' }),
      );
      return;
    }

    let next: FlowIntentEdge = {
      id: edge.id,
      from: edge.from,
      to: edge.to,
      kind: values.kind,
    };

    if (values.kind === 'state') {
      const label = values.stateLabel?.trim() ?? '';
      const description = values.stateDescription?.trim() ?? '';
      if (!description) {
        message.error(
          intl.formatMessage({
            id: 'flow.edge.stateDescriptionRequired',
          }),
        );
        return;
      }
      if (!label && !edge.state?.key?.trim()) {
        message.error(
          intl.formatMessage({ id: 'flow.edge.stateLabelRequired' }),
        );
        return;
      }

      let key = edge.state?.key?.trim() ?? '';
      if (label) {
        const allocated = await allocateLabel(label);
        if (!allocated) {
          return;
        }
        key = allocated;
      }

      next = {
        ...next,
        uiLabel: label || undefined,
        state: { key, description },
      };
    }

    onSave(next);
    onClose();
  };

  return (
    <Drawer
      title={intl.formatMessage({ id: 'flow.edge.drawerTitle' })}
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
              {intl.formatMessage({ id: 'common.delete' })}
            </button>
          ) : null}
          <button
            type="button"
            className="app-button-primary px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
            disabled={disabled || allocating}
            onClick={() => void handleOk()}
          >
            {intl.formatMessage({ id: 'common.save' })}
          </button>
        </div>
      }
    >
      {edge ? (
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          disabled={disabled}
        >
          <p className="mb-4 text-sm text-on-surface/55">
            {intl.formatMessage(
              { id: 'flow.edge.path' },
              { from: edge.from, to: edge.to },
            )}
          </p>
          {!sourceIsJudge ? (
            <Alert
              type="info"
              showIcon
              className="mb-3"
              message={intl.formatMessage({ id: 'flow.edge.alwaysOnlyHint' })}
            />
          ) : (
            <Alert
              type="info"
              showIcon
              className="mb-3"
              message={intl.formatMessage({ id: 'flow.edge.judgeHint' })}
            />
          )}
          <Form.Item
            name="kind"
            label={intl.formatMessage({ id: 'flow.edge.kind' })}
            rules={[{ required: true }]}
          >
            <Select className="app-input w-full" options={kindOptions} />
          </Form.Item>
          {kind === 'default' ? (
            <Alert
              type="info"
              showIcon
              className="mb-3"
              message={intl.formatMessage({ id: 'flow.edge.defaultHint' })}
            />
          ) : null}
          {kind === 'state' ? (
            <>
              <Form.Item
                name="stateLabel"
                label={intl.formatMessage({ id: 'flow.edge.stateLabel' })}
                rules={[
                  {
                    required: !edge.state?.key,
                    message: intl.formatMessage({
                      id: 'flow.edge.stateLabelRequired',
                    }),
                  },
                ]}
                extra={intl.formatMessage({ id: 'flow.edge.stateLabelHint' })}
              >
                <Input
                  className="app-input"
                  placeholder={intl.formatMessage({
                    id: 'flow.edge.stateLabelPlaceholder',
                  })}
                  onBlur={(event) => {
                    const label = event.target.value.trim();
                    if (!label) {
                      return;
                    }
                    void allocateLabel(label).then((key) => {
                      if (key && edge) {
                        // 失焦预分配：仅缓存 key 到表单旁展示，正式写入仍走保存
                        form.setFieldValue('stateLabel', label);
                      }
                    });
                  }}
                />
              </Form.Item>
              <Form.Item
                name="stateDescription"
                label={intl.formatMessage({ id: 'flow.edge.stateDescription' })}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'flow.edge.stateDescriptionRequired',
                    }),
                  },
                ]}
                extra={intl.formatMessage({
                  id: 'flow.edge.stateDescriptionHint',
                })}
              >
                <Input.TextArea
                  className="app-input"
                  autoSize={{ minRows: 2, maxRows: 5 }}
                  placeholder={intl.formatMessage({
                    id: 'flow.edge.stateDescriptionPlaceholder',
                  })}
                />
              </Form.Item>
              {edge.state?.key ? (
                <p className="text-xs text-on-surface/40">
                  {intl.formatMessage(
                    { id: 'flow.edge.currentKey' },
                    { key: edge.state.key },
                  )}
                </p>
              ) : null}
            </>
          ) : null}
        </Form>
      ) : null}
    </Drawer>
  );
};

export default IntentEdgePropertyDrawer;
