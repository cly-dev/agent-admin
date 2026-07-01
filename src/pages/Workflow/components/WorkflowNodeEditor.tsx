import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { WorkflowActionKind, WorkflowNodeDef, WorkflowProfile } from '@/types/workflow';
import { useIntl } from '@umijs/max';
import { Button, Input, Select } from 'antd';
import {
  actionsForProfile,
  createEmptyWorkflowNode,
  defaultInputForAction,
} from '../workflowShared';
import styles from '../index.module.scss';

type WorkflowNodeEditorProps = {
  profile: WorkflowProfile | string;
  nodes: WorkflowNodeDef[];
  disabled?: boolean;
  onChange: (nodes: WorkflowNodeDef[]) => void;
};

const WorkflowNodeEditor: React.FC<WorkflowNodeEditorProps> = ({
  profile,
  nodes,
  disabled = false,
  onChange,
}) => {
  const intl = useIntl();
  const actionOptions = actionsForProfile(profile);

  const updateNode = (nodeId: string, patch: Partial<WorkflowNodeDef>) => {
    onChange(
      nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
    );
  };

  const removeNode = (nodeId: string) => {
    onChange(nodes.filter((node) => node.id !== nodeId));
  };

  const addNode = () => {
    const defaultAction = actionOptions[0] ?? 'summarize';
    onChange([...nodes, createEmptyWorkflowNode(defaultAction)]);
  };

  const moveNode = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= nodes.length) {
      return;
    }
    const next = [...nodes];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  };

  return (
    <div className={styles.workflowNodeEditor}>
      <div className={styles.workflowNodeEditorHeader}>
        <h3 className={styles.workflowNodeEditorTitle}>
          {intl.formatMessage({ id: 'workflow.nodes.title' })}
        </h3>
        <button
          type="button"
          className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={addNode}
        >
          <PlusOutlined />
          {intl.formatMessage({ id: 'workflow.nodes.add' })}
        </button>
      </div>

      {nodes.length === 0 ? (
        <p className={styles.workflowNodeEditorEmpty}>
          {intl.formatMessage({ id: 'workflow.nodes.empty' })}
        </p>
      ) : (
        <div className={styles.workflowNodeList}>
          {nodes.map((node, index) => (
            <div key={node.id} className={styles.workflowNodeCard}>
              <div className={styles.workflowNodeCardHeader}>
                <span className={styles.workflowNodeCardIndex}>
                  {intl.formatMessage(
                    { id: 'workflow.nodes.stepLabel' },
                    { index: index + 1 },
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="small"
                    disabled={disabled || index === 0}
                    onClick={() => moveNode(index, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    size="small"
                    disabled={disabled || index === nodes.length - 1}
                    onClick={() => moveNode(index, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={disabled}
                    onClick={() => removeNode(node.id)}
                  />
                </div>
              </div>

              <div className={styles.workflowNodeGrid}>
                <div>
                  <label className={styles.workflowFieldLabel}>
                    {intl.formatMessage({ id: 'workflow.nodes.id' })}
                  </label>
                  <Input
                    className="app-input"
                    disabled={disabled}
                    value={node.id}
                    onChange={(event) =>
                      updateNode(node.id, { id: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={styles.workflowFieldLabel}>
                    {intl.formatMessage({ id: 'workflow.nodes.action' })}
                  </label>
                  <Select
                    className="app-input w-full"
                    disabled={disabled}
                    value={node.action}
                    options={actionOptions.map((action) => ({
                      value: action,
                      label: intl.formatMessage({
                        id: `workflow.action.${action}`,
                        defaultMessage: action,
                      }),
                    }))}
                    onChange={(action: WorkflowActionKind) =>
                      updateNode(node.id, {
                        action,
                        input: defaultInputForAction(action),
                      })
                    }
                  />
                </div>
                <div className={styles.workflowNodeGridFull}>
                  <label className={styles.workflowFieldLabel}>
                    {intl.formatMessage({ id: 'workflow.nodes.name' })}
                  </label>
                  <Input
                    className="app-input"
                    disabled={disabled}
                    value={node.name}
                    onChange={(event) =>
                      updateNode(node.id, { name: event.target.value })
                    }
                  />
                </div>
                <div className={styles.workflowNodeGridFull}>
                  <label className={styles.workflowFieldLabel}>
                    {intl.formatMessage({ id: 'workflow.nodes.objective' })}
                  </label>
                  <Input.TextArea
                    className="app-input"
                    disabled={disabled}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    value={node.objective}
                    onChange={(event) =>
                      updateNode(node.id, { objective: event.target.value })
                    }
                  />
                </div>
                <div className={styles.workflowNodeGridFull}>
                  <label className={styles.workflowFieldLabel}>
                    {intl.formatMessage({ id: 'workflow.nodes.input' })}
                  </label>
                  <Input.TextArea
                    className="app-input font-mono text-xs"
                    disabled={disabled}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    value={JSON.stringify(node.input ?? {}, null, 2)}
                    onChange={(event) => {
                      try {
                        const parsed = JSON.parse(event.target.value) as unknown;
                        if (
                          typeof parsed === 'object' &&
                          parsed !== null &&
                          !Array.isArray(parsed)
                        ) {
                          updateNode(node.id, {
                            input: parsed as Record<string, unknown>,
                          });
                        }
                      } catch {
                        // ignore invalid JSON while typing
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowNodeEditor;
