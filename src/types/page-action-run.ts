export type PageActionRunStatus =
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type PageActionRunDslOutcome = 'dispatched' | 'failed' | 'skipped' | string;

export type PageActionRunStepType =
  | 'lifecycle'
  | 'llm'
  | 'dsl'
  | 'workflow'
  | 'harness';

export type PageActionRunStepStatus = 'ok' | 'failed' | 'skipped';

export type PageActionRunLifecycleStepName =
  | 'queued'
  | 'started'
  | 'awaiting_approval'
  | 'approval_confirmed'
  | 'approval_rejected'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type PageActionRunStep = {
  step: number;
  type: PageActionRunStepType;
  name: string;
  at: string;
  status?: PageActionRunStepStatus;
  detail?: {
    approvalRequestId?: number;
    nodeId?: string;
    workflowId?: number;
    pendingWriteTool?: string | {
      toolId?: number;
      toolName?: string;
      hostToolId?: number;
      hostToolName?: string;
    };
    pendingWriteRiskLevel?: string;
    rejectionReason?: string;
    confirmedByUserId?: number;
    decidedByUserId?: number;
    rejectedByUserId?: number;
    errorCode?: string | null;
    chunkLength?: number;
    [key: string]: unknown;
  };
};

export type WorkflowRunNodeStatus =
  | 'pending'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'skipped';

export type WorkflowRunNode = {
  nodeId: string;
  action: string;
  status: WorkflowRunNodeStatus | string;
};

export type DetectClueResult = {
  key: string;
  matched: boolean;
  confidence?: number;
  value?: string | null;
  reason?: string;
};

export type DetectCluesNodeOutput = {
  clues?: DetectClueResult[];
  matchedClueKeys?: string[];
};

export type WorkflowRunRouting = {
  matchedClueKeys?: string[];
  enabledEdgeIds?: string[];
  pendingNodeIds?: string[];
};

export type WorkflowRunSnapshot = {
  workflowId?: number;
  version?: number;
  currentNodeId?: string;
  status?: string;
  compiledFrom?: string;
  nodes?: WorkflowRunNode[];
  /** detect_clues 等节点输出，key = nodeId */
  nodeOutputs?: Record<string, unknown>;
  routing?: WorkflowRunRouting;
};

export type PageActionRunListItem = {
  id: number;
  pageActionId: number;
  actionKey: string;
  pageActionName: string;
  userId: number;
  username: string | null;
  userEmail: string | null;
  status: PageActionRunStatus | string;
  generation: number;
  dslOutcome: PageActionRunDslOutcome | null;
  errorCode: string | null;
  errorMessage: string | null;
  streamId: string | null;
  clientActionId: string | null;
  model: string | null;
  durationMs: number | null;
  stepCount: number;
  createdAt: string;
  finishedAt: string | null;
};

export type PageActionRunDetail = PageActionRunListItem & {
  delivery: string;
  instruction: string | null;
  context: unknown | null;
  pageContext: unknown | null;
  fillText: string | null;
  errorMessage: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  idempotencyKey: string | null;
  workflowId: number | null;
  workflowVersion: number | null;
  workflowRun: WorkflowRunSnapshot | null;
  steps: PageActionRunStep[];
};

export type PageActionRunListQuery = {
  page?: number;
  pageSize?: number;
  pageActionId?: number;
  actionKey?: string;
  status?: PageActionRunStatus;
  userId?: number;
  clientActionId?: string;
};
