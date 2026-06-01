import { normalizeAgent, normalizeAgentAllowedTool } from '@/pages/Agent/agentNormalize';
import { http } from '@/utils/request';
import { normalizePageResult } from '@/utils/api-page';
import type { PageResult } from '@/types/integration';
import type {
  Agent,
  AgentAllowedToolRef,
  AgentControllerGetAgentToolsParams,
  BindAgentToolsDto,
  CreateAgentDto,
  UpdateAgentDto,
} from '@/types/agent';

const AGENT_BASE = 'admin/agent';

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

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw !== 'object' || raw === null) {
    return [];
  }
  const payload = raw as Record<string, unknown>;
  const nested =
    typeof payload.data === 'object' && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : payload;
  const listRaw = nested.list ?? nested.items ?? nested.records ?? nested.tools ?? nested;
  return Array.isArray(listRaw) ? listRaw : [];
}

/** 查询 Agent 列表 */
export async function AgentController_findAll(): Promise<Agent[]> {
  const response = await http.get<unknown>(AGENT_BASE);
  return unwrapList(response).map(normalizeAgent);
}

/** 按 AppClient ID 查询 Agent 列表 */
export async function AgentController_findByAppClient(
  appClientId: number,
): Promise<PageResult<Agent>> {
  const response = await http.get<unknown>(`${AGENT_BASE}/by-app-client/${appClientId}`);
  return normalizePageResult(response, normalizeAgent);
}

/** 创建 Agent */
export async function AgentController_create(data: CreateAgentDto) {
  const response = await http.post<unknown>(AGENT_BASE, data);
  return normalizeAgent(unwrapPayload(response));
}

/** 按 ID 查询 Agent */
export async function AgentController_findOne(id: number) {
  const response = await http.get<unknown>(`${AGENT_BASE}/${id}`);
  return normalizeAgent(unwrapPayload(response));
}

/** 按 ID 更新 Agent */
export async function AgentController_update(id: number, data: UpdateAgentDto) {
  const response = await http.patch<unknown>(`${AGENT_BASE}/${id}`, data);
  return normalizeAgent(unwrapPayload(response));
}

/** 按 ID 删除 Agent */
export function AgentController_remove(id: number) {
  return http.delete<void>(`${AGENT_BASE}/${id}`);
}

/** 分页查询 Agent 在指定 AppClient 下已绑定的 Tool */
export async function AgentController_getAgentTools(
  agentId: number,
  appClientId: number,
  params?: AgentControllerGetAgentToolsParams,
): Promise<PageResult<AgentAllowedToolRef>> {
  const response = await http.get<unknown>(
    `${AGENT_BASE}/${agentId}/app-client/${appClientId}/tools`,
    params,
  );
  return normalizePageResult(response, normalizeAgentAllowedTool);
}

/** 为 Agent 绑定 Tool（追加，已存在则跳过） */
export function AgentController_addAgentTools(
  agentId: number,
  appClientId: number,
  data: BindAgentToolsDto,
) {
  return http.post<void>(`${AGENT_BASE}/${agentId}/app-client/${appClientId}/tools`, data);
}

/** 为 Agent 解绑 Tool（未绑定的 ID 忽略） */
export function AgentController_removeAgentTools(
  agentId: number,
  appClientId: number,
  data: BindAgentToolsDto,
) {
  return http.delete<void>(
    `${AGENT_BASE}/${agentId}/app-client/${appClientId}/tools`,
    undefined,
    data,
  );
}
