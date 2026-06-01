import { http } from '@/utils/request';
import type { SessionTurnControllerFindPageBySessionIdParams } from '@/types/session-turn';

const SESSION_TURN_BASE = 'admin/session-turn';

/** 按 Session ID 分页查询 SessionTurn 列表 */
export function SessionTurnController_findPageBySessionId(
  sessionId: string,
  params?: SessionTurnControllerFindPageBySessionIdParams,
) {
  return http.get<unknown>(`${SESSION_TURN_BASE}/by-session/${sessionId}`, params);
}
