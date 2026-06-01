export type AgentRunRole = 'primary' | 'router' | 'worker' | 'reviewer';
export type AgentRunStatus = 'running' | 'success' | 'failed';

export interface AgentRun {
  id: number;
  appClientId: number;
  turnId?: number;
  agentId: number;
  sessionId: string;
  userId?: number;
  role?: AgentRunRole;
  sequence?: number;
  parentRunId?: number;
  input?: string;
  output?: string;
  status?: AgentRunStatus;
  steps?: Record<string, unknown> | unknown[];
  currentStep?: number;
  maxSteps?: number;
  error?: string;
  finishReason?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  totalTokens?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAgentRunDto {
  turnId?: number;
  agentId: number;
  sessionId: string;
  userId?: number;
  role?: AgentRunRole;
  sequence?: number;
  parentRunId?: number;
  input: string;
  output?: string;
  status?: AgentRunStatus;
  steps?: object;
  currentStep?: number;
  maxSteps: number;
  error?: string;
  finishReason?: string;
}

export interface UpdateAgentRunDto {
  turnId?: number;
  agentId?: number;
  sessionId?: string;
  userId?: number;
  role?: AgentRunRole;
  sequence?: number;
  parentRunId?: number;
  input?: string;
  output?: string;
  status?: AgentRunStatus;
  steps?: object;
  currentStep?: number;
  maxSteps?: number;
  error?: string;
  finishReason?: string;
}

export interface AgentRunControllerFindPageParams {
  page?: number;
  pageSize?: number;
  id?: number;
  turnId?: number;
  agentId?: number;
  sessionId?: string;
  userId?: number;
  role?: AgentRunRole;
  status?: AgentRunStatus;
  input?: string;
  keyword?: string;
  orderBy?:
    | 'id'
    | 'sequence'
    | 'createdAt'
    | 'updatedAt'
    | 'startedAt'
    | 'finishedAt'
    | 'durationMs'
    | 'totalTokens';
  order?: 'asc' | 'desc';
  appClientId?: number;
}
