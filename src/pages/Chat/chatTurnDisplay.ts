import type { AgentRunStatus } from '@/types/agent-run';
import type {
  MessageTurn,
  MessageTurnAgentRun,
  MessageTurnAgentRunStep,
  ToolMachineCodeCounts,
  ToolsUsedSummary,
} from '@/types/message-turn';

export const agentRunStatusColor: Record<AgentRunStatus, string> = {
  running: 'processing',
  success: 'success',
  failed: 'error',
};

export function formatMs(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) {
    return '—';
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}s`;
  }
  return `${value}ms`;
}

export function formatDateTime(value?: string): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

/** 解析 assistant 输出（支持 blocks JSON 或纯文本） */
export function formatMessageContent(raw?: string): string {
  const text = raw?.trim();
  if (!text) {
    return '—';
  }
  if (!text.startsWith('{') && !text.startsWith('[')) {
    return text;
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed === 'object' && parsed !== null && 'blocks' in parsed) {
      const blocks = (parsed as { blocks?: unknown }).blocks;
      if (Array.isArray(blocks)) {
        const parts = blocks
          .map((block) => {
            if (typeof block !== 'object' || block === null) {
              return '';
            }
            const item = block as Record<string, unknown>;
            if (typeof item.content === 'string') {
              return item.content;
            }
            return '';
          })
          .filter(Boolean);
        if (parts.length > 0) {
          return parts.join('\n\n');
        }
      }
    }
  } catch {
    return text;
  }
  return text;
}

export function isToolsUsedSummary(
  value: string[] | ToolsUsedSummary | undefined,
): value is ToolsUsedSummary {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function resolveToolNames(
  toolsUsed?: string[] | ToolsUsedSummary,
): string[] {
  if (!toolsUsed) {
    return [];
  }
  if (Array.isArray(toolsUsed)) {
    return toolsUsed;
  }
  return toolsUsed.names ?? [];
}

export function listNonZeroCodeCounts(
  counts?: ToolMachineCodeCounts,
): Array<{ code: string; count: number }> {
  if (!counts) {
    return [];
  }
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
}

export function machineCodeLabelKey(code: string): string {
  return `chat.detail.machineCode.${code}`;
}

export function renderJsonValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function stepTypeLabelKey(type?: string): string {
  if (!type) {
    return 'chat.detail.step.unknown';
  }
  const key = `chat.detail.step.${type}`;
  return key;
}

export function summarizeStepPreview(step: MessageTurnAgentRunStep): string {
  const type = step.type ?? 'unknown';
  if (type === 'write_confirmation_gate' && step.output && typeof step.output === 'object') {
    const output = step.output as Record<string, unknown>;
    const auditPhase =
      typeof output.auditPhase === 'string' ? output.auditPhase : '';
    const requestId =
      output.approvalRequestId != null ? `#${output.approvalRequestId}` : '';
    const channel =
      typeof output.rejectChannel === 'string' ? output.rejectChannel : '';
    if (auditPhase === 'awaiting_approval') {
      return requestId ? `awaiting ${requestId}` : 'awaiting approval';
    }
    if (auditPhase === 'approval_rejected') {
      return channel ? `rejected · ${channel}` : 'rejected';
    }
    if (auditPhase === 'approval_confirmed') {
      const confirmChannel =
        typeof output.confirmChannel === 'string' ? output.confirmChannel : '';
      return confirmChannel
        ? `confirmed · ${confirmChannel}`
        : requestId
          ? `confirmed ${requestId}`
          : 'confirmed';
    }
  }
  if (type === 'workflow_init_skipped' && step.output && typeof step.output === 'object') {
    const output = step.output as Record<string, unknown>;
    if (output.reason === 'trigger_permission_denied') {
      return 'trigger_permission_denied';
    }
  }
  if (type === 'tool' && step.name) {
    const latency =
      typeof step.meta?.latency === 'number' ? ` · ${step.meta.latency}ms` : '';
    return `${step.name}${latency}`;
  }
  if (type === 'llm' && step.output && typeof step.output === 'object') {
    const output = step.output as Record<string, unknown>;
    const toolCalls = output.toolCalls;
    if (Array.isArray(toolCalls) && toolCalls.length > 0) {
      const names = toolCalls
        .map((call) => {
          if (typeof call === 'object' && call !== null && 'name' in call) {
            return String((call as { name?: unknown }).name ?? '');
          }
          return '';
        })
        .filter(Boolean);
      if (names.length > 0) {
        return names.join(', ');
      }
    }
  }
  if (type === 'intent' && step.output && typeof step.output === 'object') {
    const output = step.output as Record<string, unknown>;
    const parts = [
      output.intentKind ? String(output.intentKind) : '',
      output.recallSource ? String(output.recallSource) : '',
      output.skippedTools === true ? 'skippedTools' : '',
    ].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(' · ');
    }
    if (output.intentClear === true) {
      return 'intentClear';
    }
  }
  if (type === 'summarize' && typeof step.output === 'string') {
    const text = step.output.trim();
    return text.length > 120 ? `${text.slice(0, 120)}…` : text;
  }
  const raw = renderJsonValue(step.output);
  if (!raw) {
    return type;
  }
  return raw.length > 120 ? `${raw.slice(0, 120)}…` : raw;
}

function turnSortKey(turn: MessageTurn): number {
  if (typeof turn.sequence === 'number' && turn.sequence > 0) {
    return turn.sequence;
  }
  return turn.id;
}

export function sortTurns(turns: MessageTurn[]): MessageTurn[] {
  return [...turns].sort((a, b) => turnSortKey(a) - turnSortKey(b));
}

/** 解析消息内容为 JSON 对象（纯文本则包在 text 字段） */
export function parseMessagePayload(raw?: string): unknown {
  const text = raw?.trim();
  if (!text) {
    return null;
  }
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { raw: text };
    }
  }
  return { text };
}

function compactRecord<T extends Record<string, unknown>>(
  record: T,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  );
}

function buildAgentRunMetadata(run: MessageTurnAgentRun) {
  return compactRecord({
    id: run.id,
    turnId: run.turnId,
    agentId: run.agentId,
    agent: run.agent,
    role: run.role,
    sequence: run.sequence,
    status: run.status,
    finishReason: run.finishReason,
    currentStep: run.currentStep,
    maxSteps: run.maxSteps,
    durationMs: run.durationMs,
    llmDurationMs: run.llmDurationMs,
    toolDurationMs: run.toolDurationMs,
    model: run.model,
    promptTokens: run.promptTokens,
    completionTokens: run.completionTokens,
    totalTokens: run.totalTokens,
    llmCallCount: run.llmCallCount,
    toolCallCount: run.toolCallCount,
    toolsUsed: run.toolsUsed,
    scopedToolCount: run.scopedToolCount,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    error: run.error,
    steps: run.steps,
    input: run.input,
    output: run.output,
  });
}

/** 轮次运行统计与 Agent Run 元数据 */
export function buildTurnRunMetadata(
  turn: MessageTurn,
): Record<string, unknown> {
  const agentRuns = turn.agentRuns ?? [];
  return compactRecord({
    turn: compactRecord({
      id: turn.id,
      sessionId: turn.sessionId,
      sequence: turn.sequence,
      status: turn.status,
      finishReason: turn.finishReason,
      rating: turn.rating,
      durationMs: turn.durationMs,
      llmDurationMs: turn.llmDurationMs,
      toolDurationMs: turn.toolDurationMs,
      model: turn.model,
      promptTokens: turn.promptTokens,
      completionTokens: turn.completionTokens,
      totalTokens: turn.totalTokens,
      llmCallCount: turn.llmCallCount,
      toolCallCount: turn.toolCallCount,
      agentRunCount: turn.agentRunCount ?? agentRuns.length,
      toolsUsed: turn.toolsUsed,
      toolQualityCounts: turn.toolQualityCounts,
      toolMachineCodeCounts: turn.toolMachineCodeCounts,
      startedAt: turn.startedAt,
      finishedAt: turn.finishedAt,
      error: turn.error,
    }),
    agentRuns: agentRuns.map(buildAgentRunMetadata),
  });
}

/** 单步执行元数据 */
export function buildAgentRunStepMetadata(
  step: MessageTurnAgentRunStep,
): Record<string, unknown> {
  return compactRecord({
    step: step.step,
    type: step.type,
    name: step.name,
    meta: step.meta,
    input: step.input,
    output: step.output,
  });
}

/** 用户/助手消息与结构化 payload */
export function buildTurnConversationMetadata(
  turn: MessageTurn,
): Record<string, unknown> {
  const userRaw = turn.userInput?.trim() || turn.message?.content?.trim();
  const assistantRaw =
    turn.finalOutput?.trim() || turn.outputMessage?.content?.trim();

  return compactRecord({
    user: compactRecord({
      messageId: turn.messageId,
      message: turn.message,
      userInput: turn.userInput,
      payload: parseMessagePayload(userRaw),
    }),
    assistant: compactRecord({
      outputMessageId: turn.outputMessageId,
      outputMessage: turn.outputMessage,
      finalOutput: turn.finalOutput,
      payload: parseMessagePayload(assistantRaw),
    }),
    primaryAgent: turn.primaryAgent,
  });
}
