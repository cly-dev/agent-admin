import type { useIntl } from '@umijs/max';
import {
  ApiRequestError,
  formatApiErrorMessage,
  type ValidationIssue,
} from '@/utils/api-error';
import { mapPresetIssueToMessageId } from './workflowPreset';

type IntlShape = ReturnType<typeof useIntl>;

export function resolvePresetValidationMessage(
  intl: IntlShape,
  issue: ValidationIssue,
): string {
  const messageId = mapPresetIssueToMessageId(issue.path);
  if (messageId) {
    return intl.formatMessage({ id: messageId });
  }
  return issue.message || issue.path;
}

export function formatWorkflowSaveError(
  intl: IntlShape,
  error: unknown,
  fallbackMessageId: string,
): string {
  if (error instanceof ApiRequestError) {
    const businessError = error.businessError;
    if (businessError?.code === 'WORKFLOW_CHANGE_BREAKS_SKILL_REFERENCES') {
      return intl.formatMessage(
        { id: 'workflow.error.breaksSkillRef' },
        { skillId: businessError.skillId ?? '—' },
      );
    }
    if (businessError?.code === 'WORKFLOW_CHANGE_BREAKS_PAGE_ACTION_REFERENCES') {
      return intl.formatMessage(
        { id: 'workflow.error.breaksPageActionRef' },
        { pageActionId: businessError.pageActionId ?? '—' },
      );
    }
    if (businessError?.code === 'WORKFLOW_EDGES_REQUIRED') {
      return intl.formatMessage({ id: 'workflow.error.edgesRequired' });
    }
    if (businessError?.code === 'WORKFLOW_EDGES_INVALID') {
      if (businessError.issues?.length) {
        return businessError.issues
          .map((issue) => issue.message || issue.path || issue.code)
          .filter(Boolean)
          .join(' · ');
      }
      return intl.formatMessage({ id: 'workflow.error.edgesInvalid' });
    }
    if (businessError?.code === 'WORKFLOW_VALIDATION_FAILED' && businessError.issues?.length) {
      return businessError.issues
        .map((issue) => {
          const messageId = `workflow.graphValidation.${issue.code}`;
          const translated = intl.formatMessage(
            { id: messageId, defaultMessage: issue.message || issue.code },
            { path: issue.path ?? '' },
          );
          return translated;
        })
        .join(' · ');
    }
    if (businessError?.code === 'WORKFLOW_PRESET_INVALID' && businessError.issues?.length) {
      return businessError.issues
        .map((issue) => resolvePresetValidationMessage(intl, issue))
        .join(' · ');
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
