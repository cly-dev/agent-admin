import type { useIntl } from '@umijs/max';
import {
  ApiRequestError,
  formatApiErrorMessage,
} from '@/utils/api-error';

type IntlShape = ReturnType<typeof useIntl>;

export function formatFlowSaveError(
  intl: IntlShape,
  error: unknown,
  fallbackMessageId: string,
): string {
  if (error instanceof ApiRequestError) {
    const businessError = error.businessError;
    if (businessError?.code === 'FLOW_STILL_BOUND') {
      return intl.formatMessage({ id: 'flow.error.stillBound' });
    }
    if (businessError?.code === 'FLOW_HAS_PENDING_APPROVALS') {
      return intl.formatMessage({ id: 'flow.error.pendingApprovals' });
    }
    if (businessError?.code === 'FLOW_HAS_ACTIVE_RUNS') {
      return intl.formatMessage({ id: 'flow.error.activeRuns' });
    }
    if (
      businessError?.code === 'FLOW_PRESET_INTENT_CONFLICT' ||
      businessError?.code === 'WORKFLOW_PRESET_INTENT_CONFLICT'
    ) {
      return intl.formatMessage({ id: 'flow.error.presetIntentConflict' });
    }
    if (businessError?.code === 'WORKFLOW_INTENT_REQUIRED') {
      return intl.formatMessage({ id: 'flow.error.intentRequired' });
    }
    if (businessError?.code === 'FLOW_TOOL_NOT_FOUND') {
      return intl.formatMessage({ id: 'flow.error.toolNotFound' });
    }
    if (businessError?.code === 'FLOW_HOST_TOOL_NOT_FOUND') {
      return intl.formatMessage({ id: 'flow.error.hostToolNotFound' });
    }
    if (businessError?.code === 'FLOW_REVISION_NOT_FOUND') {
      return intl.formatMessage({ id: 'flow.error.revisionNotFound' });
    }
    if (businessError?.code === 'LEGACY_WORKFLOW_BINDING_REMOVED') {
      return intl.formatMessage({ id: 'flow.error.legacyWorkflowRemoved' });
    }
    if (businessError?.code === 'judge_missing_default') {
      return intl.formatMessage({
        id: 'flow.intent.validation.judgeMissingDefault',
      });
    }
    if (businessError?.code === 'judge_default_without_state') {
      return intl.formatMessage({
        id: 'flow.intent.validation.judgeDefaultWithoutState',
      });
    }
    if (businessError?.code === 'judge_needs_branches') {
      return intl.formatMessage({
        id: 'flow.intent.validation.judgeNeedsBranches',
      });
    }
    if (businessError?.code === 'branch_edge_not_from_judge') {
      return intl.formatMessage({
        id: 'flow.intent.validation.branchNotFromJudge',
      });
    }
    if (businessError?.code === 'missing_state') {
      return intl.formatMessage({
        id: 'flow.intent.validation.stateRequired',
      });
    }
    if (businessError?.issues?.length) {
      return businessError.issues
        .map((issue) => issue.message || issue.path)
        .filter(Boolean)
        .join(' · ');
    }
  }
  return formatApiErrorMessage(
    error,
    intl.formatMessage({ id: fallbackMessageId }),
  );
}
