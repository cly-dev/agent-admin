// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: src/services/api-gen/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import { http } from "@/utils/request";
import type {
  AgentRunControllerFindPageParams,
  CreateAgentRunDto,
  UpdateAgentRunDto,
} from "@/types/agent-run";

/**
 * 按 AppClient 分页查询 AgentRun 列表
 * @tags agent-run
 */
export function AgentRunController_findPage(appClientId: number, params?: AgentRunControllerFindPageParams) {
  return http.get<void>(`admin/agent-run/by-app-client/${appClientId}`, params);
}

/**
 * 按 AppClient 创建 AgentRun
 * @tags agent-run
 */
export function AgentRunController_create(appClientId: number, data: CreateAgentRunDto) {
  return http.post<void>(`admin/agent-run/by-app-client/${appClientId}`, data);
}

/**
 * 按 AppClient + ID 查询 AgentRun 详情
 * @tags agent-run
 */
export function AgentRunController_findOne(appClientId: number, id: number) {
  return http.get<void>(`admin/agent-run/by-app-client/${appClientId}/${id}`);
}

/**
 * 按 AppClient + ID 更新 AgentRun
 * @tags agent-run
 */
export function AgentRunController_update(appClientId: number, id: number, data: UpdateAgentRunDto) {
  return http.patch<void>(`admin/agent-run/by-app-client/${appClientId}/${id}`, data);
}

/**
 * 按 AppClient + ID 删除 AgentRun
 * @tags agent-run
 */
export function AgentRunController_remove(appClientId: number, id: number) {
  return http.delete<void>(`admin/agent-run/by-app-client/${appClientId}/${id}`);
}
