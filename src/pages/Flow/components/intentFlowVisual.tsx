import type { FlowIntentOperation, FlowIntentStep } from '@/types/flow-intent';
import {
  CheckCircleOutlined,
  CloudDownloadOutlined,
  EditOutlined,
  SendOutlined,
  SplitCellsOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

export type IntentFlowNodeData = {
  intentStepId: string;
  operation: FlowIntentOperation;
  name?: string;
  objective?: string;
  operationLabel?: string;
  /** judge 节点摘要：如「2 状态 + 默认」 */
  branchSummary?: string;
  /** 判定分支末梢占位 */
  isBranchTip?: boolean;
  layoutOrientation?: 'horizontal' | 'vertical';
  selected?: boolean;
};

export const INTENT_OPERATION_VISUAL: Record<
  FlowIntentOperation,
  {
    strip: string;
    border: string;
    iconBg: string;
    iconFg: string;
    icon: ReactNode;
  }
> = {
  read: {
    strip: '#0e7490',
    border: '#99f6e4',
    iconBg: 'rgba(8,145,178,0.12)',
    iconFg: '#0e7490',
    icon: <CloudDownloadOutlined />,
  },
  judge: {
    strip: '#c2410c',
    border: '#fdba74',
    iconBg: 'rgba(234,88,12,0.12)',
    iconFg: '#c2410c',
    icon: <SplitCellsOutlined />,
  },
  deliver: {
    strip: '#0369a1',
    border: '#7dd3fc',
    iconBg: 'rgba(14,165,233,0.12)',
    iconFg: '#0369a1',
    icon: <SendOutlined />,
  },
  mutate: {
    strip: '#7c3aed',
    border: '#c4b5fd',
    iconBg: 'rgba(124,58,237,0.12)',
    iconFg: '#7c3aed',
    icon: <CheckCircleOutlined />,
  },
};

export function getIntentOperationVisual(operation: FlowIntentOperation) {
  return INTENT_OPERATION_VISUAL[operation] ?? {
    strip: '#64748b',
    border: '#cbd5e1',
    iconBg: 'rgba(100,116,139,0.12)',
    iconFg: '#64748b',
    icon: <EditOutlined />,
  };
}

export function intentStepToFlowData(
  step: FlowIntentStep,
  operationLabel?: string,
): IntentFlowNodeData {
  return {
    intentStepId: step.id,
    operation: step.operation,
    name: step.name,
    objective: step.objective,
    operationLabel,
    isBranchTip: step.branchTip === true,
  };
}

export function stepDisplayName(
  step: FlowIntentStep,
  formatMessage: (desc: { id: string }) => string,
): string {
  if (step.name?.trim()) {
    return step.name.trim();
  }
  if (step.operation === 'deliver' && step.channel === 'fill') {
    return formatMessage({ id: 'flow.intent.list.fill' });
  }
  if (step.operation === 'deliver' && step.channel === 'speak') {
    return formatMessage({ id: 'flow.intent.list.speak' });
  }
  return formatMessage({ id: `flow.intent.operation.${step.operation}` });
}
