// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: src/services/api-gen/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import { http } from "@/utils/request";
import type {
  CreateSessionDto,
  UpdateSessionDto,
} from "@/types/session";

/**
 * 按 AppClient 创建 Session
 * @tags session
 */
export function SessionController_create(appClientId: number, data: CreateSessionDto) {
  return http.post<void>(`admin/session/by-app-client/${appClientId}`, data);
}

/**
 * 按 AppClient + Session ID 查询详情
 * @tags session
 */
export function SessionController_findOne(appClientId: number, id: string) {
  return http.get<void>(`admin/session/by-app-client/${appClientId}/${id}`);
}

/**
 * 按 AppClient + Session ID 更新 Session
 * @tags session
 */
export function SessionController_update(appClientId: number, id: string, data: UpdateSessionDto) {
  return http.patch<void>(`admin/session/by-app-client/${appClientId}/${id}`, data);
}

/**
 * 按 AppClient + Session ID 删除 Session
 * @tags session
 */
export function SessionController_remove(appClientId: number, id: string) {
  return http.delete<void>(`admin/session/by-app-client/${appClientId}/${id}`);
}
