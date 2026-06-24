import type { PageResult } from '@/types/integration';
import type {
  MessageFeedbackControllerFindPageParams,
  MessageFeedbackDownReasonTag,
  MessageFeedbackListItem,
  MessageFeedbackMessageRef,
  MessageFeedbackRating,
  MessageFeedbackSessionRef,
  MessageFeedbackSummary,
  MessageFeedbackUserRef,
} from '@/types/message-feedback';
import { normalizePageResult } from '@/utils/api-page';
import { http } from '@/utils/request';

const FEEDBACK_BASE = 'admin/message-feedback/by-app-client';

function unwrapPayload(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const payload = raw as Record<string, unknown>;
  if (typeof payload.data === 'object' && payload.data !== null) {
    return payload.data as Record<string, unknown>;
  }
  return payload;
}

function normalizeRating(value: unknown): MessageFeedbackRating {
  return value === 'down' ? 'down' : 'up';
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeMessageRef(raw: unknown): MessageFeedbackMessageRef {
  const item =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  return {
    id: Number(item.id ?? 0),
    role: typeof item.role === 'string' ? item.role : 'assistant',
    contentPreview:
      typeof item.contentPreview === 'string'
        ? item.contentPreview
        : typeof item.content_preview === 'string'
          ? item.content_preview
          : null,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
  };
}

function normalizeUserRef(raw: unknown): MessageFeedbackUserRef {
  const item =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  return {
    id: Number(item.id ?? 0),
    username: typeof item.username === 'string' ? item.username : '',
    employeeId:
      typeof item.employeeId === 'string'
        ? item.employeeId
        : typeof item.employee_id === 'string'
          ? item.employee_id
          : '',
    email: typeof item.email === 'string' ? item.email : '',
  };
}

function normalizeSessionRef(raw: unknown): MessageFeedbackSessionRef {
  const item =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  return {
    id: String(item.id ?? ''),
    title: typeof item.title === 'string' ? item.title : null,
    agentId: Number(item.agentId ?? item.agent_id) || null,
  };
}

function normalizeFeedbackItem(raw: unknown): MessageFeedbackListItem {
  const item = unwrapPayload(raw);
  const agentIdRaw = item.agentId ?? item.agent_id;
  const turnIdRaw = item.turnId ?? item.turn_id;

  return {
    id: Number(item.id ?? 0),
    messageId: Number(item.messageId ?? item.message_id ?? 0),
    sessionId: String(item.sessionId ?? item.session_id ?? ''),
    userId: Number(item.userId ?? item.user_id ?? 0),
    appClientId: Number(item.appClientId ?? item.app_client_id ?? 0),
    turnId:
      turnIdRaw === null || turnIdRaw === undefined
        ? null
        : Number(turnIdRaw) || null,
    agentId:
      agentIdRaw === null || agentIdRaw === undefined
        ? null
        : Number(agentIdRaw) || null,
    agentName:
      typeof item.agentName === 'string'
        ? item.agentName
        : typeof item.agent_name === 'string'
          ? item.agent_name
          : null,
    rating: normalizeRating(item.rating),
    reasonTags: normalizeStringArray(item.reasonTags ?? item.reason_tags),
    reasonTagLabels: normalizeStringArray(
      item.reasonTagLabels ?? item.reason_tag_labels,
    ),
    comment: typeof item.comment === 'string' ? item.comment : null,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : '',
    message: normalizeMessageRef(item.message),
    user: normalizeUserRef(item.user),
    session: normalizeSessionRef(item.session),
  };
}

function normalizeDownReasonTag(
  raw: unknown,
): MessageFeedbackDownReasonTag | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const key = typeof item.key === 'string' ? item.key : '';
  const label = typeof item.label === 'string' ? item.label : '';
  if (!key) {
    return null;
  }
  return { key, label: label || key };
}

function normalizeSummary(raw: unknown): MessageFeedbackSummary {
  const item = unwrapPayload(raw);
  const totalsRaw =
    typeof item.totals === 'object' && item.totals !== null
      ? (item.totals as Record<string, unknown>)
      : {};

  const downReasonTagCountsRaw =
    item.downReasonTagCounts ?? item.down_reason_tag_counts;
  const downByAgentRaw = item.downByAgent ?? item.down_by_agent;

  return {
    windowDays: Number(item.windowDays ?? item.window_days ?? 7),
    from: typeof item.from === 'string' ? item.from : '',
    to: typeof item.to === 'string' ? item.to : '',
    totals: {
      feedback: Number(totalsRaw.feedback ?? 0),
      up: Number(totalsRaw.up ?? 0),
      down: Number(totalsRaw.down ?? 0),
      upRate: Number(totalsRaw.upRate ?? totalsRaw.up_rate ?? 0),
    },
    downReasonTagCounts: Array.isArray(downReasonTagCountsRaw)
      ? downReasonTagCountsRaw
          .map((row) => {
            if (typeof row !== 'object' || row === null) {
              return null;
            }
            const tag = row as Record<string, unknown>;
            const key = typeof tag.key === 'string' ? tag.key : '';
            if (!key) {
              return null;
            }
            return {
              key,
              label: typeof tag.label === 'string' ? tag.label : key,
              count: Number(tag.count ?? 0),
            };
          })
          .filter((row): row is NonNullable<typeof row> => row !== null)
      : [],
    downByAgent: Array.isArray(downByAgentRaw)
      ? downByAgentRaw
          .map((row) => {
            if (typeof row !== 'object' || row === null) {
              return null;
            }
            const agent = row as Record<string, unknown>;
            const agentId = Number(agent.agentId ?? agent.agent_id ?? 0);
            if (!agentId) {
              return null;
            }
            return {
              agentId,
              agentName:
                typeof agent.agentName === 'string'
                  ? agent.agentName
                  : typeof agent.agent_name === 'string'
                    ? agent.agent_name
                    : `#${agentId}`,
              downCount: Number(agent.downCount ?? agent.down_count ?? 0),
            };
          })
          .filter((row): row is NonNullable<typeof row> => row !== null)
      : [],
  };
}

/** 点踩原因标签字典 */
export async function MessageFeedbackController_findDownReasonTags(
  appClientId: number,
): Promise<MessageFeedbackDownReasonTag[]> {
  const response = await http.get<unknown>(
    `${FEEDBACK_BASE}/${appClientId}/down-reason-tags`,
  );
  const payload = unwrapPayload(response);
  const items = payload.items ?? payload.list;
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map(normalizeDownReasonTag)
    .filter((item): item is MessageFeedbackDownReasonTag => item !== null);
}

/** 反馈汇总看板 */
export async function MessageFeedbackController_findSummary(
  appClientId: number,
  days = 7,
): Promise<MessageFeedbackSummary> {
  const response = await http.get<unknown>(
    `${FEEDBACK_BASE}/${appClientId}/summary`,
    { days },
  );
  return normalizeSummary(response);
}

/** 分页查询反馈列表 */
export async function MessageFeedbackController_findPage(
  appClientId: number,
  params?: MessageFeedbackControllerFindPageParams,
): Promise<PageResult<MessageFeedbackListItem>> {
  const response = await http.get<unknown>(
    `${FEEDBACK_BASE}/${appClientId}`,
    params,
  );
  return normalizePageResult(response, normalizeFeedbackItem);
}

/** 按会话分页查询反馈 */
export async function MessageFeedbackController_findPageBySession(
  appClientId: number,
  sessionId: string,
  params?: MessageFeedbackControllerFindPageParams,
): Promise<PageResult<MessageFeedbackListItem>> {
  const response = await http.get<unknown>(
    `${FEEDBACK_BASE}/${appClientId}/by-session/${sessionId}`,
    params,
  );
  return normalizePageResult(response, normalizeFeedbackItem);
}

/** 单条反馈详情 */
export async function MessageFeedbackController_findOne(
  appClientId: number,
  id: number,
): Promise<MessageFeedbackListItem> {
  const response = await http.get<unknown>(
    `${FEEDBACK_BASE}/${appClientId}/${id}`,
  );
  return normalizeFeedbackItem(response);
}
