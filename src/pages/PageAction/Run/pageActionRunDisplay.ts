import type {
  PageActionRunDetail,
  PageActionRunLifecycleStepName,
  PageActionRunListItem,
  PageActionRunStatus,
  PageActionRunStep,
} from '@/types/page-action-run';
import { formatDateTime } from '@/pages/Chat/chatTurnDisplay';

export const PAGE_ACTION_RUN_LIST_PATH = '/workflow/page-action-run';

export const WORKFLOW_TRIGGER_PERMISSION_DENIED =
  'WORKFLOW_TRIGGER_PERMISSION_DENIED';

export const PAGE_ACTION_RUN_LIFECYCLE_APPROVAL_STEPS = [
  'awaiting_approval',
  'approval_confirmed',
  'approval_rejected',
] as const satisfies readonly PageActionRunLifecycleStepName[];

export const PAGE_ACTION_RUN_STATUS_COLORS: Record<string, string> = {
  running: 'processing',
  awaiting_approval: 'warning',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
};

export function formatPageActionRunDateTime(value?: string | null): string {
  return formatDateTime(value ?? undefined);
}

export function formatPageActionRunTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString();
}

export function formatDurationMs(value?: number | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '—';
  }
  if (value < 1000) return `${value}ms`;
  const seconds = Math.floor(value / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  if (minutes < 60) {
    return remSec > 0 ? `${minutes}m ${remSec}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
}

export function formatUserLabel(
  username: string | null | undefined,
  email: string | null | undefined,
  userId: number,
): string {
  if (username?.trim()) {
    return email?.trim() ? `${username} (${email})` : username;
  }
  if (email?.trim()) return email;
  return `#${userId}`;
}

export function isPageActionRunPending(status: string): boolean {
  return status === 'running' || status === 'awaiting_approval';
}

export function isApprovalLifecycleStep(step: PageActionRunStep): boolean {
  return (
    step.type === 'lifecycle' &&
    (PAGE_ACTION_RUN_LIFECYCLE_APPROVAL_STEPS as readonly string[]).includes(
      step.name,
    )
  );
}

export function findLatestApprovalStep(
  steps: PageActionRunStep[] | undefined,
): PageActionRunStep | undefined {
  if (!steps?.length) return undefined;
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    if (isApprovalLifecycleStep(steps[i])) return steps[i];
  }
  return undefined;
}

export function hasApprovalRejectedStep(
  steps: PageActionRunStep[] | undefined,
): boolean {
  return (
    steps?.some(
      (step) => step.type === 'lifecycle' && step.name === 'approval_rejected',
    ) ?? false
  );
}

export function isWorkflowTriggerPermissionDenied(run: {
  errorCode?: string | null;
  errorMessage?: string | null;
}): boolean {
  if (run.errorCode === WORKFLOW_TRIGGER_PERMISSION_DENIED) return true;
  return (
    typeof run.errorMessage === 'string' &&
    run.errorMessage.includes(WORKFLOW_TRIGGER_PERMISSION_DENIED)
  );
}

export function formatPageActionRunFinishedAt(
  status: string,
  finishedAt: string | null | undefined,
): string {
  if (isPageActionRunPending(status)) return '—';
  return formatPageActionRunDateTime(finishedAt);
}

export function formatDwellDuration(
  createdAt: string | undefined,
  finishedAt: string | null | undefined,
  status: string,
): string {
  if (!createdAt) return '—';
  const start = new Date(createdAt).getTime();
  if (!Number.isFinite(start)) return '—';
  const end =
    finishedAt && !isPageActionRunPending(status)
      ? new Date(finishedAt).getTime()
      : Date.now();
  if (!Number.isFinite(end)) return '—';
  const ms = Math.max(0, end - start);
  if (ms < 1000) return '<1s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  if (minutes < 60) {
    return remSec > 0 ? `${minutes}m ${remSec}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
}

function formatPendingWriteTool(
  detail: Record<string, unknown>,
): string | undefined {
  const pending = detail.pendingWriteTool;
  if (typeof pending === 'string' && pending.trim()) {
    return pending;
  }
  if (typeof pending === 'object' && pending !== null) {
    const item = pending as Record<string, unknown>;
    if (typeof item.toolName === 'string' && item.toolName.trim()) {
      return item.toolName;
    }
    if (typeof item.toolId === 'number') {
      return `tool#${item.toolId}`;
    }
  }
  return undefined;
}

type IntlLike = {
  formatMessage: (
    descriptor: { id: string; defaultMessage?: string },
    values?: Record<string, string | number>,
  ) => string;
};

export function summarizeApprovalStepDetail(
  step: PageActionRunStep,
  intl: IntlLike,
): string | undefined {
  const detail = step.detail;
  if (!detail) return undefined;

  if (step.name === 'awaiting_approval') {
    const toolName = formatPendingWriteTool(detail);
    const riskLevel =
      typeof detail.pendingWriteRiskLevel === 'string'
        ? detail.pendingWriteRiskLevel
        : undefined;
    if (toolName && riskLevel) {
      return intl.formatMessage(
        { id: 'pageActionRun.approval.pendingWriteToolWithRisk' },
        { toolName, riskLevel },
      );
    }
    if (toolName) {
      return intl.formatMessage(
        { id: 'pageActionRun.approval.pendingWriteTool' },
        { toolName },
      );
    }
    if (detail.approvalRequestId != null) {
      return intl.formatMessage(
        { id: 'pageActionRun.approval.requestId' },
        { id: detail.approvalRequestId },
      );
    }
  }

  if (step.name === 'approval_rejected') {
    if (typeof detail.rejectionReason === 'string' && detail.rejectionReason) {
      return intl.formatMessage(
        { id: 'pageActionRun.approval.rejectionReason' },
        { reason: detail.rejectionReason },
      );
    }
    if (detail.decidedByUserId != null) {
      return intl.formatMessage(
        { id: 'pageActionRun.approval.rejectedBy' },
        { userId: detail.decidedByUserId },
      );
    }
  }

  if (step.name === 'approval_confirmed') {
    if (detail.approvalRequestId != null) {
      return intl.formatMessage(
        { id: 'pageActionRun.approval.requestId' },
        { id: detail.approvalRequestId },
      );
    }
    if (detail.confirmedByUserId != null) {
      return intl.formatMessage(
        { id: 'pageActionRun.approval.confirmedBy' },
        { userId: detail.confirmedByUserId },
      );
    }
  }

  return undefined;
}

export function summarizePageActionRunStep(
  step: PageActionRunStep,
  intl: IntlLike,
): string {
  const approvalSummary = summarizeApprovalStepDetail(step, intl);
  if (approvalSummary) return approvalSummary;

  if (step.detail && Object.keys(step.detail).length > 0) {
    try {
      return JSON.stringify(step.detail);
    } catch {
      return String(step.detail);
    }
  }
  return '—';
}

/** @deprecated Use summarizePageActionRunStep with intl in components */
export function summarizeStepDetail(step: PageActionRunStep): string {
  const detail = step.detail;
  if (!detail || Object.keys(detail).length === 0) return '—';

  if (isApprovalLifecycleStep(step)) {
    const toolName = formatPendingWriteTool(detail);
    if (step.name === 'awaiting_approval' && toolName) {
      const risk =
        typeof detail.pendingWriteRiskLevel === 'string'
          ? ` · ${detail.pendingWriteRiskLevel}`
          : '';
      return `${toolName}${risk}`;
    }
    if (detail.approvalRequestId != null) {
      return `#${detail.approvalRequestId}`;
    }
  }

  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

export type PageActionRunTimelineEntry =
  | { kind: 'step'; step: PageActionRunStep }
  | {
      kind: 'append-group';
      steps: PageActionRunStep[];
      count: number;
      totalChunkLength: number;
      firstAt: string;
      lastAt: string;
    };

export function groupPageActionRunSteps(
  steps: PageActionRunStep[],
): PageActionRunTimelineEntry[] {
  const entries: PageActionRunTimelineEntry[] = [];
  let appendBuffer: PageActionRunStep[] = [];

  const flushAppend = () => {
    if (appendBuffer.length === 0) return;
    const totalChunkLength = appendBuffer.reduce((sum, step) => {
      const len =
        typeof step.detail?.chunkLength === 'number'
          ? step.detail.chunkLength
          : 0;
      return sum + len;
    }, 0);
    entries.push({
      kind: 'append-group',
      steps: appendBuffer,
      count: appendBuffer.length,
      totalChunkLength,
      firstAt: appendBuffer[0].at,
      lastAt: appendBuffer[appendBuffer.length - 1].at,
    });
    appendBuffer = [];
  };

  for (const step of steps) {
    if (step.type === 'dsl' && step.name === 'arg.append') {
      appendBuffer.push(step);
    } else {
      flushAppend();
      entries.push({ kind: 'step', step });
    }
  }
  flushAppend();
  return entries;
}

export function resolvePageActionRunStatusAlert(
  run: PageActionRunDetail,
  intl: IntlLike,
): { type: 'info' | 'warning' | 'error'; message: string } | null {
  if (run.status === 'awaiting_approval') {
    return {
      type: 'warning',
      message: intl.formatMessage({ id: 'pageActionRun.detail.alert.awaitingApproval' }),
    };
  }
  if (
    run.status === 'cancelled' &&
    hasApprovalRejectedStep(run.steps)
  ) {
    return {
      type: 'info',
      message: intl.formatMessage({ id: 'pageActionRun.detail.alert.approvalRejected' }),
    };
  }
  if (isWorkflowTriggerPermissionDenied(run)) {
    return {
      type: 'error',
      message: intl.formatMessage({
        id: 'pageActionRun.detail.alert.permissionDenied',
      }),
    };
  }
  return null;
}

export const PAGE_ACTION_RUN_FILTER_STATUSES: PageActionRunStatus[] = [
  'running',
  'awaiting_approval',
  'completed',
  'failed',
  'cancelled',
];
