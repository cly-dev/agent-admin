// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: src/services/api-gen/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import { http } from "@/utils/request";
import type {
  SessionTurnControllerFindPageBySessionIdParams,
} from "@/types/session-turn";

/**
 * 按 Session ID 分页查询 SessionTurn 列表
 * @tags session-turn
 */
export function SessionTurnController_findPageBySessionId(sessionId: string, params?: SessionTurnControllerFindPageBySessionIdParams) {
  return http.get<void>(`admin/session-turn/by-session/${sessionId}`, params);
}
