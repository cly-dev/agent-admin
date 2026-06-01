import { http } from '@/utils/request';
import { normalizePageResult } from '@/utils/api-page';
import type { PageResult } from '@/types/integration';
import type {
  AgentRun,
  AgentRunControllerFindPageParams,
  CreateAgentRunDto,
  UpdateAgentRunDto,
} from '@/types/agent-run';

const AGENT_RUN_BASE = 'admin/agent-run';

function unwrapPayload(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const payload = raw as Record<string, unknown>;
  if (typeof payload.data === 'object' && payload.data !== null) {
    return payload.data as Record<string, unknown>;
  }
  if (typeof payload.item === 'object' && payload.item !== null) {
    return payload.item as Record<string, unknown>;
  }
  if (typeof payload.agentRun === 'object' && payload.agentRun !== null) {
    return payload.agentRun as Record<string, unknown>;
  }
  return payload;
}

function normalizeTextField(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? value : undefined;
  }
  if (value === undefined || value === null) {
    return undefined;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function normalizeAgentRun(raw: unknown): AgentRun {
  const item = unwrapPayload(raw);
  const stepsRaw = item.steps;
  const steps =
    typeof stepsRaw === 'object' && stepsRaw !== null
      ? (stepsRaw as Record<string, unknown> | unknown[])
      : undefined;

  return {
    id: Number(item.id ?? item.runId ?? item.run_id ?? 0),
    appClientId: Number(item.appClientId ?? item.app_client_id ?? 0),
    turnId: Number(item.turnId ?? item.turn_id) || undefined,
    agentId: Number(item.agentId ?? item.agent_id ?? 0),
    sessionId: String(item.sessionId ?? item.session_id ?? ''),
    userId: Number(item.userId ?? item.user_id) || undefined,
    role:
      item.role === 'primary' ||
      item.role === 'router' ||
      item.role === 'worker' ||
      item.role === 'reviewer'
        ? item.role
        : undefined,
    sequence: Number(item.sequence) || undefined,
    parentRunId: Number(item.parentRunId ?? item.parent_run_id) || undefined,
    input: normalizeTextField(item.input),
    output: normalizeTextField(item.output),
    status:
      item.status === 'running' || item.status === 'success' || item.status === 'failed'
        ? item.status
        : undefined,
    steps,
    currentStep: Number(item.currentStep ?? item.current_step) || undefined,
    maxSteps: Number(item.maxSteps ?? item.max_steps) || undefined,
    error: typeof item.error === 'string' ? item.error : undefined,
    finishReason: typeof item.finishReason === 'string' ? item.finishReason : undefined,
    startedAt: typeof item.startedAt === 'string' ? item.startedAt : undefined,
    finishedAt: typeof item.finishedAt === 'string' ? item.finishedAt : undefined,
    durationMs: Number(item.durationMs ?? item.duration_ms) || undefined,
    totalTokens: Number(item.totalTokens ?? item.total_tokens) || undefined,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
  };
}

/** 按 AppClient 分页查询 Agent 运行记录 */
export async function AgentRunController_findPage(
  appClientId: number,
  params?: AgentRunControllerFindPageParams,
): Promise<PageResult<AgentRun>> {
  const response = await http.get<unknown>(`${AGENT_RUN_BASE}/by-app-client/${appClientId}`, params);
  return normalizePageResult(response, normalizeAgentRun);
}

/** 按 AppClient + ID 查询 Agent 运行记录详情 */
export async function AgentRunController_findOne(appClientId: number, id: number): Promise<AgentRun> {
  const response = await http.get<unknown>(`${AGENT_RUN_BASE}/by-app-client/${appClientId}/${id}`);
  return normalizeAgentRun(response);
}

/** 按 AppClient 创建 Agent 运行记录 */
export function AgentRunController_create(appClientId: number, data: CreateAgentRunDto) {
  return http.post<void>(`${AGENT_RUN_BASE}/by-app-client/${appClientId}`, data);
}

/** 按 AppClient + ID 更新 Agent 运行记录 */
export function AgentRunController_update(appClientId: number, id: number, data: UpdateAgentRunDto) {
  return http.patch<void>(`${AGENT_RUN_BASE}/by-app-client/${appClientId}/${id}`, data);
}

/** 按 AppClient + ID 删除 Agent 运行记录 */
export function AgentRunController_remove(appClientId: number, id: number) {
  return http.delete<void>(`${AGENT_RUN_BASE}/by-app-client/${appClientId}/${id}`);
}
