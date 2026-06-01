import { http } from '@/utils/request';
import { normalizePageResult } from '@/utils/api-page';
import type { PageResult } from '@/types/integration';
import type {
  CreateSessionDto,
  Session,
  SessionControllerFindPageParams,
  UpdateSessionDto,
} from '@/types/session';

const SESSION_BASE = 'admin/session';

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

function normalizeSession(raw: unknown): Session {
  const item = unwrapPayload(raw);
  return {
    id: String(item.id ?? ''),
    appClientId: Number(item.appClientId ?? item.app_client_id ?? 0),
    userId: Number(item.userId ?? item.user_id ?? 0),
    agentId: Number(item.agentId ?? item.agent_id) || undefined,
    title: typeof item.title === 'string' ? item.title : undefined,
    messageCount: Number(item.messageCount ?? item.message_count) || undefined,
    rated: typeof item.rated === 'boolean' ? item.rated : undefined,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
  };
}

/** 按 AppClient 分页查询 Session 列表 */
export async function SessionController_findPage(
  appClientId: number,
  params?: SessionControllerFindPageParams,
): Promise<PageResult<Session>> {
  const response = await http.get<unknown>(`${SESSION_BASE}/by-app-client/${appClientId}`, params);
  return normalizePageResult(response, normalizeSession);
}

/** 按 AppClient 创建 Session */
export async function SessionController_create(appClientId: number, data: CreateSessionDto) {
  const response = await http.post<unknown>(`${SESSION_BASE}/by-app-client/${appClientId}`, data);
  return normalizeSession(response);
}

/** 按 AppClient + Session ID 查询详情 */
export async function SessionController_findOne(appClientId: number, id: string) {
  const response = await http.get<unknown>(`${SESSION_BASE}/by-app-client/${appClientId}/${id}`);
  return normalizeSession(response);
}

/** 按 AppClient + Session ID 更新 Session */
export async function SessionController_update(
  appClientId: number,
  id: string,
  data: UpdateSessionDto,
) {
  const response = await http.patch<unknown>(`${SESSION_BASE}/by-app-client/${appClientId}/${id}`, data);
  return normalizeSession(response);
}

/** 按 AppClient + Session ID 删除 Session */
export function SessionController_remove(appClientId: number, id: string) {
  return http.delete<void>(`${SESSION_BASE}/by-app-client/${appClientId}/${id}`);
}
