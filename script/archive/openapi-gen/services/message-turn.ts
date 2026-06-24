// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/services/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import type { MessageTurnController_findPageBySessionIdParams } from '@/types/message-turn';
import { http } from '@/utils/request';

/**
 * 按 Session ID 分页查询 MessageTurn 列表
 * @tags message-turn
 */
export function MessageTurnController_findPageBySessionId(
  sessionId: string,
  params?: MessageTurnController_findPageBySessionIdParams,
) {
  return http.get<void>(`admin/message-turn/by-session/${sessionId}`, params);
}
