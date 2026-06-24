import type { MessageFeedbackControllerFindPageParams } from '@/types/message-feedback';

export type MessageFeedbackFilterValues = {
  keyword?: string;
  id?: number;
  rating?: 'up' | 'down';
  agentId?: number;
  userId?: number;
  sessionId?: string;
  messageId?: number;
  turnId?: number;
  reasonTag?: string;
  commentKeyword?: string;
};

export type MessageFeedbackFilterFormValues = MessageFeedbackFilterValues;

function trimOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export function normalizeMessageFeedbackFilter(
  values: MessageFeedbackFilterFormValues,
): MessageFeedbackFilterValues {
  const keyword = trimOptionalString(values.keyword);
  const commentKeyword = trimOptionalString(values.commentKeyword) ?? keyword;

  return {
    id: finiteNumber(values.id),
    rating:
      values.rating === 'up' || values.rating === 'down'
        ? values.rating
        : undefined,
    agentId: finiteNumber(values.agentId),
    userId: finiteNumber(values.userId),
    sessionId: trimOptionalString(values.sessionId),
    messageId: finiteNumber(values.messageId),
    turnId: finiteNumber(values.turnId),
    reasonTag: trimOptionalString(values.reasonTag),
    commentKeyword,
  };
}

export function buildMessageFeedbackQuery(
  filters: MessageFeedbackFilterValues,
  pagination: Pick<
    MessageFeedbackControllerFindPageParams,
    'page' | 'pageSize' | 'orderBy' | 'order'
  >,
): MessageFeedbackControllerFindPageParams {
  return {
    ...pagination,
    ...filters,
  };
}

export function countActiveMessageFeedbackFilters(
  filters: MessageFeedbackFilterValues,
): number {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === 'keyword') {
      return false;
    }
    return value !== undefined && value !== '';
  }).length;
}
