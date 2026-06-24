import type { PageResult } from '@/types/integration';
import type {
  MessageTurn,
  MessageTurnAgentRef,
  MessageTurnAgentRun,
  MessageTurnAgentRunStep,
  MessageTurnAppClientRef,
  MessageTurnControllerFindPageBySessionIdParams,
  MessageTurnMessageRef,
  MessageTurnSessionRef,
  MessageTurnUserRef,
  ToolMachineCodeCounts,
  ToolQualityCounts,
  ToolsUsedSummary,
} from '@/types/message-turn';
import { normalizePageResult } from '@/utils/api-page';
import { http } from '@/utils/request';

const MESSAGE_TURN_BASE = 'admin/message-turn';

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

function normalizeRating(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeAgentRef(raw: unknown): MessageTurnAgentRef | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const item = raw as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) {
    return undefined;
  }
  return {
    id,
    name: typeof item.name === 'string' ? item.name : undefined,
  };
}

function normalizeMessageRef(raw: unknown): MessageTurnMessageRef | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const item = raw as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) {
    return undefined;
  }
  return {
    id,
    role: typeof item.role === 'string' ? item.role : undefined,
    content: normalizeTextField(item.content),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
  };
}

function normalizeSessionRef(raw: unknown): MessageTurnSessionRef | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const item = raw as Record<string, unknown>;
  const id = String(item.id ?? '');
  if (!id) {
    return undefined;
  }
  return {
    id,
    title: typeof item.title === 'string' ? item.title : undefined,
  };
}

function normalizeUserRef(raw: unknown): MessageTurnUserRef | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const item = raw as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) {
    return undefined;
  }
  return {
    id,
    username: typeof item.username === 'string' ? item.username : undefined,
    email: typeof item.email === 'string' ? item.email : undefined,
  };
}

function normalizeAppClientRef(
  raw: unknown,
): MessageTurnAppClientRef | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const item = raw as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) {
    return undefined;
  }
  return {
    id,
    name: typeof item.name === 'string' ? item.name : undefined,
  };
}

function normalizeQualityCounts(raw: unknown): ToolQualityCounts | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const item = raw as Record<string, unknown>;
  const high = normalizeNumber(item.high);
  const medium = normalizeNumber(item.medium);
  const low = normalizeNumber(item.low);
  if (high === undefined && medium === undefined && low === undefined) {
    return undefined;
  }
  return { high, medium, low };
}

function normalizeCodeCounts(raw: unknown): ToolMachineCodeCounts | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const item = raw as Record<string, unknown>;
  const result: ToolMachineCodeCounts = {};
  Object.entries(item).forEach(([key, value]) => {
    const num = normalizeNumber(value);
    if (num !== undefined) {
      result[key] = num;
    }
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeStringList(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const list = raw.map((item) => String(item)).filter(Boolean);
  return list.length > 0 ? list : undefined;
}

function normalizeToolsUsedSummary(
  raw: unknown,
): string[] | ToolsUsedSummary | undefined {
  if (Array.isArray(raw)) {
    return normalizeStringList(raw);
  }
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const item = raw as Record<string, unknown>;
  const names = normalizeStringList(item.names);
  const codeCounts = normalizeCodeCounts(item.codeCounts ?? item.code_counts);
  const qualityCounts = normalizeQualityCounts(
    item.qualityCounts ?? item.quality_counts,
  );
  if (!names && !codeCounts && !qualityCounts) {
    return undefined;
  }
  return { names, codeCounts, qualityCounts };
}

function normalizeAgentRunStep(raw: unknown): MessageTurnAgentRunStep | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const meta =
    typeof item.meta === 'object' && item.meta !== null
      ? (item.meta as Record<string, unknown>)
      : undefined;
  return {
    step: normalizeNumber(item.step),
    type: typeof item.type === 'string' ? item.type : undefined,
    name: typeof item.name === 'string' ? item.name : undefined,
    meta,
    input: item.input,
    output: item.output,
  };
}

function normalizeAgentRun(raw: unknown): MessageTurnAgentRun | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const statusRaw = item.status;
  const status =
    statusRaw === 'running' || statusRaw === 'success' || statusRaw === 'failed'
      ? statusRaw
      : undefined;

  const roleRaw = item.role;
  const role =
    roleRaw === 'primary' ||
    roleRaw === 'router' ||
    roleRaw === 'worker' ||
    roleRaw === 'reviewer'
      ? roleRaw
      : undefined;

  const stepsRaw = item.steps;
  const steps = Array.isArray(stepsRaw)
    ? stepsRaw
        .map((step) => normalizeAgentRunStep(step))
        .filter((step): step is MessageTurnAgentRunStep => step !== null)
    : undefined;

  const toolsUsed = normalizeToolsUsedSummary(
    item.toolsUsed ?? item.tools_used,
  );

  const parentRunId = normalizeNumber(item.parentRunId ?? item.parent_run_id);

  return {
    id,
    turnId: normalizeNumber(item.turnId ?? item.turn_id),
    agentId: Number(item.agentId ?? item.agent_id ?? 0),
    appClientId: normalizeNumber(item.appClientId ?? item.app_client_id),
    sessionId:
      typeof item.sessionId === 'string'
        ? item.sessionId
        : typeof item.session_id === 'string'
          ? item.session_id
          : undefined,
    userId: normalizeNumber(item.userId ?? item.user_id),
    role,
    sequence: normalizeNumber(item.sequence),
    parentRunId: parentRunId ?? null,
    input: normalizeTextField(item.input),
    output: normalizeTextField(item.output),
    status,
    steps,
    currentStep: normalizeNumber(item.currentStep ?? item.current_step),
    maxSteps: normalizeNumber(item.maxSteps ?? item.max_steps),
    error:
      typeof item.error === 'string'
        ? item.error
        : item.error === null
          ? null
          : undefined,
    finishReason:
      typeof item.finishReason === 'string'
        ? item.finishReason
        : typeof item.finish_reason === 'string'
          ? item.finish_reason
          : undefined,
    startedAt: typeof item.startedAt === 'string' ? item.startedAt : undefined,
    finishedAt:
      typeof item.finishedAt === 'string' ? item.finishedAt : undefined,
    durationMs: normalizeNumber(item.durationMs ?? item.duration_ms),
    llmDurationMs: normalizeNumber(item.llmDurationMs ?? item.llm_duration_ms),
    toolDurationMs: normalizeNumber(
      item.toolDurationMs ?? item.tool_duration_ms,
    ),
    model: typeof item.model === 'string' ? item.model : undefined,
    promptTokens: normalizeNumber(item.promptTokens ?? item.prompt_tokens),
    completionTokens: normalizeNumber(
      item.completionTokens ?? item.completion_tokens,
    ),
    totalTokens: normalizeNumber(item.totalTokens ?? item.total_tokens),
    llmCallCount: normalizeNumber(item.llmCallCount ?? item.llm_call_count),
    toolCallCount: normalizeNumber(item.toolCallCount ?? item.tool_call_count),
    toolsUsed,
    scopedToolCount: normalizeNumber(
      item.scopedToolCount ?? item.scoped_tool_count,
    ),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
    agent: normalizeAgentRef(item.agent),
  };
}

export function normalizeMessageTurn(raw: unknown): MessageTurn {
  const item = unwrapPayload(raw);
  const statusRaw = item.status;
  const status =
    statusRaw === 'running' || statusRaw === 'success' || statusRaw === 'failed'
      ? statusRaw
      : undefined;

  const agentRunsRaw = item.agentRuns ?? item.agent_runs;
  const agentRuns = Array.isArray(agentRunsRaw)
    ? agentRunsRaw
        .map((run) => normalizeAgentRun(run))
        .filter((run): run is MessageTurnAgentRun => run !== null)
    : undefined;

  const toolsUsed = normalizeStringList(item.toolsUsed ?? item.tools_used);
  const toolQualityCounts = normalizeQualityCounts(
    item.toolQualityCounts ?? item.tool_quality_counts,
  );
  const toolMachineCodeCounts = normalizeCodeCounts(
    item.toolMachineCodeCounts ?? item.tool_machine_code_counts,
  );

  return {
    id: Number(item.id ?? 0),
    sessionId:
      typeof item.sessionId === 'string'
        ? item.sessionId
        : typeof item.session_id === 'string'
          ? item.session_id
          : undefined,
    messageId: normalizeNumber(item.messageId ?? item.message_id),
    userId: normalizeNumber(item.userId ?? item.user_id),
    appClientId: normalizeNumber(item.appClientId ?? item.app_client_id),
    primaryAgentId: normalizeNumber(
      item.primaryAgentId ?? item.primary_agent_id,
    ),
    sequence: normalizeNumber(item.sequence),
    status,
    userInput: normalizeTextField(item.userInput ?? item.user_input),
    finalOutput: normalizeTextField(item.finalOutput ?? item.final_output),
    rating: normalizeRating(item.rating ?? item.score ?? item.assistantRating),
    error: typeof item.error === 'string' ? item.error : undefined,
    agentRunCount: normalizeNumber(item.agentRunCount ?? item.agent_run_count),
    startedAt: typeof item.startedAt === 'string' ? item.startedAt : undefined,
    finishedAt:
      typeof item.finishedAt === 'string' ? item.finishedAt : undefined,
    durationMs: normalizeNumber(item.durationMs ?? item.duration_ms),
    llmDurationMs: normalizeNumber(item.llmDurationMs ?? item.llm_duration_ms),
    toolDurationMs: normalizeNumber(
      item.toolDurationMs ?? item.tool_duration_ms,
    ),
    model: typeof item.model === 'string' ? item.model : undefined,
    promptTokens: normalizeNumber(item.promptTokens ?? item.prompt_tokens),
    completionTokens: normalizeNumber(
      item.completionTokens ?? item.completion_tokens,
    ),
    totalTokens: normalizeNumber(item.totalTokens ?? item.total_tokens),
    llmCallCount: normalizeNumber(item.llmCallCount ?? item.llm_call_count),
    toolCallCount: normalizeNumber(item.toolCallCount ?? item.tool_call_count),
    toolsUsed,
    toolQualityCounts,
    toolMachineCodeCounts,
    finishReason:
      typeof item.finishReason === 'string'
        ? item.finishReason
        : typeof item.finish_reason === 'string'
          ? item.finish_reason
          : undefined,
    outputMessageId: normalizeNumber(
      item.outputMessageId ?? item.output_message_id,
    ),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
    agentRuns,
    message: normalizeMessageRef(item.message),
    outputMessage: normalizeMessageRef(
      item.outputMessage ?? item.output_message,
    ),
    primaryAgent: normalizeAgentRef(item.primaryAgent ?? item.primary_agent),
    session: normalizeSessionRef(item.session),
    user: normalizeUserRef(item.user),
    appClient: normalizeAppClientRef(item.appClient ?? item.app_client),
  };
}

/** 按 Session ID 分页查询 MessageTurn 列表 */
export async function MessageTurnController_findPageBySessionId(
  sessionId: string,
  params?: MessageTurnControllerFindPageBySessionIdParams,
): Promise<PageResult<MessageTurn>> {
  const response = await http.get<unknown>(
    `${MESSAGE_TURN_BASE}/by-session/${encodeURIComponent(sessionId)}`,
    params,
  );
  return normalizePageResult(response, normalizeMessageTurn);
}
