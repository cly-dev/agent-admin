import type { WorkflowActionKind, WorkflowProfile } from '@/types/workflow';
import { actionsForProfile } from './workflowShared';

/** 方案 A：四阶段节点分类（UI 层，不改变后端 action 枚举） */
export type WorkflowNodePhase =
  | 'prepare_acquire'
  | 'generate_process'
  | 'deliver_present'
  | 'effect_confirm';

export const WORKFLOW_NODE_PHASES: WorkflowNodePhase[] = [
  'prepare_acquire',
  'generate_process',
  'deliver_present',
  'effect_confirm',
];

export const WORKFLOW_ACTION_PHASE: Record<
  WorkflowActionKind,
  WorkflowNodePhase
> = {
  load_page_context: 'prepare_acquire',
  fetch_data: 'prepare_acquire',
  generate_and_push: 'generate_process',
  compose_mutation: 'generate_process',
  summarize: 'deliver_present',
  present_mutation: 'deliver_present',
  write_data: 'effect_confirm',
  await_user_confirm: 'effect_confirm',
};

/** X6 React 节点在独立渲染树中无法使用 IntlProvider，用作兜底文案 */
export const WORKFLOW_PHASE_SHORT_LABEL_FALLBACK: Record<
  WorkflowNodePhase,
  string
> = {
  prepare_acquire: '获取',
  generate_process: '处理',
  deliver_present: '交付',
  effect_confirm: '确认',
};

/** X6 React 节点无 Intl 上下文时的 action 短标签 */
export const WORKFLOW_ACTION_SHORT_LABEL_FALLBACK: Record<
  WorkflowActionKind,
  string
> = {
  load_page_context: '加载上下文',
  fetch_data: '获取数据',
  generate_and_push: '生成推送',
  summarize: '说明总结',
  compose_mutation: '组装变更',
  present_mutation: '展示草稿',
  write_data: '提交变更',
  await_user_confirm: '等待确认',
};

/** X6 React 节点无 Intl 时的审批门提示 */
export const WORKFLOW_AWAIT_CONFIRM_GATE_HINT_FALLBACK =
  '挂起等 C 端确认后才执行 write_data';

export const WORKFLOW_PHASE_VISUAL: Record<
  WorkflowNodePhase,
  { strip: string; badgeBg: string; badgeFg: string; border: string }
> = {
  prepare_acquire: {
    strip: '#1677ff',
    badgeBg: 'rgba(22,119,255,0.1)',
    badgeFg: '#1677ff',
    border: 'rgba(22,119,255,0.28)',
  },
  generate_process: {
    strip: '#10b981',
    badgeBg: 'rgba(16,185,129,0.1)',
    badgeFg: '#10b981',
    border: 'rgba(16,185,129,0.28)',
  },
  deliver_present: {
    strip: '#7c3aed',
    badgeBg: 'rgba(124,58,237,0.1)',
    badgeFg: '#7c3aed',
    border: 'rgba(124,58,237,0.28)',
  },
  effect_confirm: {
    strip: '#f59e0b',
    badgeBg: 'rgba(245,158,11,0.1)',
    badgeFg: '#f59e0b',
    border: 'rgba(245,158,11,0.28)',
  },
};

export function getActionPhase(action: WorkflowActionKind): WorkflowNodePhase {
  return WORKFLOW_ACTION_PHASE[action] ?? 'generate_process';
}

export function phasesForProfile(profile: WorkflowProfile | string): WorkflowNodePhase[] {
  if (profile === 'page_action') {
    return ['prepare_acquire', 'generate_process', 'deliver_present'];
  }
  return WORKFLOW_NODE_PHASES;
}

export function actionsForPhase(
  phase: WorkflowNodePhase,
  profile: WorkflowProfile | string,
): WorkflowActionKind[] {
  return actionsForProfile(profile).filter(
    (action) => WORKFLOW_ACTION_PHASE[action] === phase,
  );
}

export type WorkflowActionPhaseGroup = {
  phase: WorkflowNodePhase;
  actions: WorkflowActionKind[];
};

export function actionsGroupedByPhase(
  profile: WorkflowProfile | string,
): WorkflowActionPhaseGroup[] {
  return phasesForProfile(profile)
    .map((phase) => ({
      phase,
      actions: actionsForPhase(phase, profile),
    }))
    .filter((group) => group.actions.length > 0);
}

export function defaultActionForProfile(
  profile: WorkflowProfile | string,
): WorkflowActionKind {
  return (
    actionsForPhase('prepare_acquire', profile)[0] ??
    actionsForProfile(profile)[0] ??
    'load_page_context'
  );
}
