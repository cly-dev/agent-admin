import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import { useIntl } from '@umijs/max';
import { Checkbox, Collapse } from 'antd';
import type { WorkflowHostToolRow, WorkflowToolRow } from '../workflowShared';
import styles from '../index.module.scss';

type WorkflowRequiredBindingsPanelProps = {
  toolRows: WorkflowToolRow[];
  hostToolRows: WorkflowHostToolRow[];
  tools: Tool[];
  hostTools: HostTool[];
  disabled?: boolean;
  onToolRequiredChange: (toolId: number, isRequired: boolean) => void;
  onHostToolRequiredChange: (hostToolId: number, isRequired: boolean) => void;
};

const WorkflowRequiredBindingsPanel: React.FC<WorkflowRequiredBindingsPanelProps> = ({
  toolRows,
  hostToolRows,
  tools,
  hostTools,
  disabled = false,
  onToolRequiredChange,
  onHostToolRequiredChange,
}) => {
  const intl = useIntl();

  if (toolRows.length === 0 && hostToolRows.length === 0) {
    return null;
  }

  return (
    <Collapse
      bordered={false}
      className="bg-transparent"
      items={[
        {
          key: 'required-bindings',
          label: intl.formatMessage({ id: 'workflow.detail.advancedBindings' }),
          children: (
            <div className={styles.workflowRequiredBindings}>
              <p className={styles.workflowBindingHint}>
                {intl.formatMessage({ id: 'workflow.detail.advancedBindingsHint' })}
              </p>
              {toolRows.length > 0 ? (
                <div className={styles.workflowRequiredBindingGroup}>
                  <h4 className={styles.workflowFieldLabel}>
                    {intl.formatMessage({ id: 'workflow.binding.tools' })}
                  </h4>
                  <ul className={styles.workflowRequiredBindingList}>
                    {toolRows.map((row) => {
                      const tool = tools.find((item) => item.id === row.toolId);
                      return (
                        <li key={row.toolId} className={styles.workflowRequiredBindingItem}>
                          <span>
                            {tool?.name ?? row.name ?? `#${row.toolId}`} (#{row.toolId})
                          </span>
                          <Checkbox
                            checked={row.isRequired}
                            disabled={disabled}
                            onChange={(event) =>
                              onToolRequiredChange(row.toolId, event.target.checked)
                            }
                          >
                            {intl.formatMessage({ id: 'workflow.binding.isRequired' })}
                          </Checkbox>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              {hostToolRows.length > 0 ? (
                <div className={styles.workflowRequiredBindingGroup}>
                  <h4 className={styles.workflowFieldLabel}>
                    {intl.formatMessage({ id: 'workflow.binding.hostTools' })}
                  </h4>
                  <ul className={styles.workflowRequiredBindingList}>
                    {hostToolRows.map((row) => {
                      const tool = hostTools.find((item) => item.id === row.hostToolId);
                      return (
                        <li
                          key={row.hostToolId}
                          className={styles.workflowRequiredBindingItem}
                        >
                          <span>
                            {tool?.name ?? row.name ?? `#${row.hostToolId}`} (#
                            {row.hostToolId})
                          </span>
                          <Checkbox
                            checked={row.isRequired}
                            disabled={disabled}
                            onChange={(event) =>
                              onHostToolRequiredChange(
                                row.hostToolId,
                                event.target.checked,
                              )
                            }
                          >
                            {intl.formatMessage({ id: 'workflow.binding.isRequired' })}
                          </Checkbox>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          ),
        },
      ]}
    />
  );
};

export default WorkflowRequiredBindingsPanel;
