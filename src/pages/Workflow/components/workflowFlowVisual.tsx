import type { WorkflowActionKind } from '@/types/workflow';
import type { FlowNodeStatus } from '@/types/flow-canvas';
import {
  getActionPhase,
  WORKFLOW_ACTION_SHORT_LABEL_FALLBACK,
  WORKFLOW_PHASE_SHORT_LABEL_FALLBACK,
  WORKFLOW_PHASE_VISUAL,
} from '../workflowNodePhase';
import { resolvePhaseShortLabel, resolveAwaitUserConfirmGateHint } from './workflowFlowLabels';
import {
  CloudDownloadOutlined,
  DesktopOutlined,
  EditOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  SaveOutlined,
  SendOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

export type WorkflowFlowNodeData = {
  nodeType: 'execute';
  status?: FlowNodeStatus;
  name?: string;
  description?: string;
  layoutOrientation?: 'horizontal' | 'vertical';
  workflowAction: WorkflowActionKind;
  workflowNodeId: string;
  workflowName: string;
  workflowInput: Record<string, unknown>;
  /** 由画布在挂载时注入，供 X6 React 节点渲染（无 Intl 上下文） */
  phaseShortLabel?: string;
  actionShortLabel?: string;
  gateHint?: string;
  bindingLabel?: string | null;
  needsBinding?: boolean;
  selected?: boolean;
};

export const WORKFLOW_ACTION_VISUAL: Record<
  WorkflowActionKind,
  {
    iconBg: string;
    iconFg: string;
    icon: ReactNode;
  }
> = {
  load_page_context: {
    iconBg: 'rgba(22,119,255,0.12)',
    iconFg: '#1677ff',
    icon: <FileSearchOutlined />,
  },
  fetch_data: {
    iconBg: 'rgba(8,145,178,0.12)',
    iconFg: '#0e7490',
    icon: <CloudDownloadOutlined />,
  },
  generate_and_push: {
    iconBg: 'rgba(124,58,237,0.12)',
    iconFg: '#6d28d9',
    icon: <SendOutlined />,
  },
  summarize: {
    iconBg: 'rgba(16,185,129,0.12)',
    iconFg: '#047857',
    icon: <FileTextOutlined />,
  },
  compose_mutation: {
    iconBg: 'rgba(245,158,11,0.12)',
    iconFg: '#b45309',
    icon: <EditOutlined />,
  },
  present_mutation: {
    iconBg: 'rgba(236,72,153,0.12)',
    iconFg: '#be185d',
    icon: <DesktopOutlined />,
  },
  write_data: {
    iconBg: 'rgba(99,102,241,0.12)',
    iconFg: '#4338ca',
    icon: <SaveOutlined />,
  },
  await_user_confirm: {
    iconBg: 'rgba(139,92,246,0.12)',
    iconFg: '#5b21b6',
    icon: <UserOutlined />,
  },
};

export function getWorkflowActionVisual(action: WorkflowActionKind | string) {
  if (!(action in WORKFLOW_ACTION_VISUAL)) {
    return fallbackWorkflowActionVisual(action);
  }
  const typedAction = action as WorkflowActionKind;
  const phase = getActionPhase(typedAction);
  const phaseVisual = WORKFLOW_PHASE_VISUAL[phase];
  const actionVisual = WORKFLOW_ACTION_VISUAL[typedAction];
  return {
    strip: phaseVisual.strip,
    border: phaseVisual.border,
    phase,
    iconBg: phaseVisual.badgeBg,
    iconFg: phaseVisual.badgeFg,
    icon: actionVisual.icon,
  };
}

export function fallbackWorkflowActionVisual(action: string) {
  const phaseVisual = WORKFLOW_PHASE_VISUAL.generate_process;
  return {
    strip: phaseVisual.strip,
    border: phaseVisual.border,
    phase: 'generate_process' as const,
    iconBg: phaseVisual.badgeBg,
    iconFg: phaseVisual.badgeFg,
    icon: <ThunderboltOutlined />,
  };
}

export function workflowNodeStatus(node: {
  name?: string;
  objective?: string;
}): FlowNodeStatus {
  const hasName = Boolean(node.name?.trim());
  const hasObjective = Boolean(node.objective?.trim());
  return hasName && hasObjective ? 'config' : 'unconfig';
}

export function workflowNodeBindingMeta(
  action: WorkflowActionKind,
  input: Record<string, unknown>,
): { bindingLabel: string | null; needsBinding: boolean } {
  const toolId = input.toolId;
  const hostToolId = input.hostToolId;
  const toolActions: WorkflowActionKind[] = [
    'fetch_data',
    'compose_mutation',
    'write_data',
  ];

  if (toolActions.includes(action)) {
    if (typeof toolId === 'number' && toolId > 0) {
      return { bindingLabel: `Tool #${toolId}`, needsBinding: false };
    }
    return { bindingLabel: null, needsBinding: true };
  }

  if (action === 'generate_and_push') {
    if (typeof hostToolId === 'number' && hostToolId > 0) {
      return { bindingLabel: `HostTool #${hostToolId}`, needsBinding: false };
    }
    return { bindingLabel: null, needsBinding: true };
  }

  return { bindingLabel: null, needsBinding: false };
}

export function workflowNodeToFlowData(node: {
  id: string;
  action: WorkflowActionKind;
  name: string;
  objective: string;
  input: Record<string, unknown>;
}): WorkflowFlowNodeData {
  const phase = getActionPhase(node.action);
  const displayName = node.name?.trim() || node.id;
  const binding = workflowNodeBindingMeta(node.action, node.input ?? {});
  return {
    nodeType: 'execute',
    status: workflowNodeStatus({ name: node.name, objective: node.objective }),
    name: displayName,
    description: node.objective,
    workflowAction: node.action,
    workflowNodeId: node.id,
    workflowName: node.name ?? '',
    workflowInput: node.input ?? {},
    phaseShortLabel:
      resolvePhaseShortLabel(phase) ||
      WORKFLOW_PHASE_SHORT_LABEL_FALLBACK[phase],
    actionShortLabel: WORKFLOW_ACTION_SHORT_LABEL_FALLBACK[node.action],
    gateHint:
      node.action === 'await_user_confirm'
        ? resolveAwaitUserConfirmGateHint()
        : undefined,
    bindingLabel: binding.bindingLabel,
    needsBinding: binding.needsBinding,
    selected: false,
  };
}
