import type { AgentRunRole, AgentRunStatus } from '@/types/agent-run';

export type MessageTurnStatus = AgentRunStatus;

export interface MessageTurnAgentRef {
  id: number;
  name?: string;
}

export interface MessageTurnMessageRef {
  id: number;
  role?: string;
  content?: string;
  createdAt?: string;
}

export interface MessageTurnSessionRef {
  id: string;
  title?: string;
}

export interface MessageTurnUserRef {
  id: number;
  username?: string;
  email?: string;
}

export interface MessageTurnAppClientRef {
  id: number;
  name?: string;
}

export interface ToolQualityCounts {
  high?: number;
  medium?: number;
  low?: number;
}

export type ToolMachineCodeCounts = Record<string, number>;

export interface ToolsUsedSummary {
  names?: string[];
  codeCounts?: ToolMachineCodeCounts;
  qualityCounts?: ToolQualityCounts;
}

export interface MessageTurnAgentRunStep {
  step?: number;
  type?: string;
  name?: string;
  meta?: Record<string, unknown>;
  input?: unknown;
  output?: unknown;
}

export interface MessageTurnAgentRun {
  id: number;
  turnId?: number;
  agentId: number;
  appClientId?: number;
  sessionId?: string;
  userId?: number;
  role?: AgentRunRole;
  sequence?: number;
  parentRunId?: number | null;
  input?: string;
  output?: string;
  status?: AgentRunStatus;
  steps?: MessageTurnAgentRunStep[];
  currentStep?: number;
  maxSteps?: number;
  error?: string | null;
  finishReason?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  llmDurationMs?: number;
  toolDurationMs?: number;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  llmCallCount?: number;
  toolCallCount?: number;
  toolsUsed?: string[] | ToolsUsedSummary;
  scopedToolCount?: number;
  createdAt?: string;
  updatedAt?: string;
  agent?: MessageTurnAgentRef;
}

export interface MessageTurn {
  id: number;
  sessionId?: string;
  messageId?: number;
  userId?: number;
  appClientId?: number;
  primaryAgentId?: number;
  sequence?: number;
  status?: MessageTurnStatus;
  userInput?: string;
  finalOutput?: string;
  rating?: number;
  error?: string;
  agentRunCount?: number;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  llmDurationMs?: number;
  toolDurationMs?: number;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  llmCallCount?: number;
  toolCallCount?: number;
  toolsUsed?: string[];
  toolQualityCounts?: ToolQualityCounts;
  toolMachineCodeCounts?: ToolMachineCodeCounts;
  finishReason?: string;
  outputMessageId?: number;
  createdAt?: string;
  updatedAt?: string;
  agentRuns?: MessageTurnAgentRun[];
  message?: MessageTurnMessageRef;
  outputMessage?: MessageTurnMessageRef;
  primaryAgent?: MessageTurnAgentRef;
  session?: MessageTurnSessionRef;
  user?: MessageTurnUserRef;
  appClient?: MessageTurnAppClientRef;
}

export interface MessageTurnControllerFindPageBySessionIdParams {
  page?: number;
  pageSize?: number;
  id?: number;
  messageId?: number;
  userId?: number;
  appClientId?: number;
  primaryAgentId?: number;
  status?: MessageTurnStatus;
  userInput?: string;
  keyword?: string;
  orderBy?:
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'startedAt'
    | 'finishedAt'
    | 'durationMs'
    | 'totalTokens';
  order?: 'asc' | 'desc';
}
