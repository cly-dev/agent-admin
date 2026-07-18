import type { FC } from 'react';
import type { Node } from '@antv/x6';
import {
  getIntentOperationVisual,
  type IntentFlowNodeData,
} from './intentFlowVisual';
import styles from './IntentFlowNodeReact.module.scss';
import tipStyles from '../../Workflow/components/WorkflowFlowNodeReact.module.scss';

export const IntentFlowNodeReact: FC<{ node: Node }> = ({ node }) => {
  const data = (node.getData() ?? {}) as IntentFlowNodeData;
  const visual = getIntentOperationVisual(data.operation);
  const name =
    data.name?.trim() ||
    data.operationLabel?.trim() ||
    data.intentStepId ||
    ' ';
  const description = data.objective?.trim() ?? '';

  // 与 Workflow 状态识别分支 tip 相同样式
  if (data.isBranchTip) {
    const tipClass = [
      tipStyles.branchRect,
      data.selected ? tipStyles.branchRectSelected : '',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <div className={tipClass} title={description || name}>
        <span className={tipStyles.branchRectLabel}>{name}</span>
      </div>
    );
  }

  const nodeClassName = [
    styles.node,
    data.selected ? styles.nodeSelected : '',
  ]
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
          <div className={styles.operation}>
            {data.operation === 'judge' ? '判定分流' : data.operation}
          </div>
          <div className={styles.name} title={name}>
            {name}
          </div>
          {data.branchSummary ? (
            <div className={styles.description} title={data.branchSummary}>
              {data.branchSummary}
            </div>
          ) : description ? (
            <div className={styles.description} title={description}>
              {description}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
