import type { FC } from 'react';
import type { Node } from '@antv/x6';
import {
  getWorkflowActionVisual,
  type WorkflowFlowNodeData,
} from './workflowFlowVisual';
import styles from './WorkflowFlowNodeReact.module.scss';

export const WorkflowFlowNodeReact: FC<{ node: Node }> = ({ node }) => {
  const data = (node.getData() ?? {}) as WorkflowFlowNodeData;
  const action = data.workflowAction ?? 'summarize';
  const visual = getWorkflowActionVisual(action);

  const name =
    data.name?.trim() || data.workflowName?.trim() || data.workflowNodeId || ' ';
  const description = data.description?.trim() ?? '';
  const gateHint = data.gateHint?.trim() ?? '';

  const nodeClassName = [styles.node, data.selected ? styles.nodeSelected : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={nodeClassName}
      style={{ borderColor: data.selected ? visual.strip : visual.border }}
    >
      <div className={styles.strip} style={{ backgroundColor: visual.strip }} />

      <div className={styles.body}>
        <div
          className={styles.icon}
          style={{
            backgroundColor: visual.iconBg,
            color: visual.iconFg,
          }}
        >
          {visual.icon}
        </div>

        <div className={styles.content}>
          <div className={styles.name} title={name}>
            {name}
          </div>
          {description ? (
            <div className={styles.description} title={description}>
              {description}
            </div>
          ) : null}
          {gateHint ? (
            <div className={styles.gateHint} title={gateHint}>
              {gateHint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
