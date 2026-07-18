export type WorkflowProfile = 'chat_skill' | 'page_action' | 'shared';

export type WorkflowDeliverable =
  | 'answer'
  | 'analysis'
  | 'list'
  | 'detail'
  | 'mutation';

export type WorkflowPresetKind =
  | 'page_auto_fill'
  | 'page_context_push'
  | 'page_context_mutation_submit'
  | 'fetch_push_summarize'
  | 'fetch_and_answer'
  | 'mutation_submit';

export type WorkflowPresetObjectiveConfig = {
  loadPage?: string;
  fetch?: string;
  push?: string;
  compose?: string;
  present?: string;
  write?: string;
  summarize?: string;
};

export type WorkflowPresetConfig = {
  readToolId?: number;
  writeToolId?: number;
  hostToolId?: number;
  fetchCompleteWhen?: 'first_success' | 'fetch_all_pages';
  pushStream?: boolean;
  summarizeMode?: 'brief' | 'detailed' | 'final';
  presentMode?: 'brief' | 'detailed';
  confirmKind?: 'mutation' | 'generic';
  materializePageContext?: boolean;
  /** Flow 产品：变更确认前说明（高级，默认关） */
  explainBeforeConfirm?: boolean;
  /** Flow 产品：写后口头说明（高级，默认关） */
  summarizeAfter?: boolean;
  objectives?: WorkflowPresetObjectiveConfig;
};

export type WorkflowPresetCatalogEntry = {
  kind: WorkflowPresetKind;
  label: string;
  description: string;
  profiles: WorkflowProfile[];
  requiredConfig: Array<keyof WorkflowPresetConfig>;
  optionalConfig: Array<keyof WorkflowPresetConfig>;
  expandedActions: string[];
};

export type WorkflowActionKind =
  | 'load_page_context'
  | 'detect_clues'
  | 'fetch_data'
  | 'summarize_images'
  | 'generate_and_push'
  | 'summarize'
  | 'compose_mutation'
  | 'present_mutation'
  | 'write_data'
  | 'await_user_confirm';

export type SummarizeImagesFrom = 'upstream' | 'page_context' | 'all';
export type SummarizeImagesOnFailure = 'degrade' | 'fail';

/** Workflow 节点 input：action === 'summarize_images' */
export type SummarizeImagesNodeInput = {
  from?: SummarizeImagesFrom;
  maxCells?: number;
  cellPx?: number;
  hint?: string;
  onFailure?: SummarizeImagesOnFailure;
  cacheTtlSec?: number;
};

export type WorkflowEdgeKind = 'always' | 'clue' | 'default';

export type WorkflowEdgeClue = {
  key: string;
  description: string;
};

export type WorkflowEdge = {
  id: string;
  from: string;
  to: string;
  kind?: WorkflowEdgeKind;
  clue?: WorkflowEdgeClue;
};

/** B 端写入 / 服务端落库文档形态 */
export type WorkflowNodesDocument = {
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId?: string;
};

export type WorkflowNodeDef = {
  id: string;
  action: WorkflowActionKind;
  name: string;
  objective: string;
  input: Record<string, unknown>;
};

export type WorkflowToolBinding = {
  id?: number;
  toolId: number;
  isRequired: boolean;
  tool?: {
    id: number;
    name?: string;
    path?: string;
    method?: string;
    definitionKey?: string;
  };
};

export type WorkflowHostToolBinding = {
  id?: number;
  hostToolId: number;
  isRequired: boolean;
  hostTool?: {
    id: number;
    name: string;
    pageScope?: string | null;
    definitionKey?: string;
  };
};

export type Workflow = {
  id: number;
  appClientId: number;
  appClientName?: string;
  workflowKey: string;
  name: string;
  description: string | null;
  goal: string | null;
  profile: WorkflowProfile | string;
  deliverable: WorkflowDeliverable | string;
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId?: string;
  version: number;
  constraints: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  workflowTools: WorkflowToolBinding[];
  workflowHostTools: WorkflowHostToolBinding[];
  skillRefCount: number;
  pageActionRefCount: number;
  revisionCount?: number;
  nodeCount?: number;
};

export type WorkflowListItem = Omit<
  Workflow,
  | 'nodes'
  | 'edges'
  | 'entryNodeId'
  | 'workflowTools'
  | 'workflowHostTools'
  | 'constraints'
  | 'goal'
> & {
  nodeCount: number;
};

export type WorkflowRevision = {
  id: number;
  workflowId: number;
  version: number;
  deliverable: string;
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId?: string;
  constraints: string[];
  changeNote: string | null;
  createdAt: string;
  isCurrent?: boolean;
};

export type WorkflowRevisionSummary = Pick<
  WorkflowRevision,
  | 'id'
  | 'workflowId'
  | 'version'
  | 'deliverable'
  | 'changeNote'
  | 'createdAt'
  | 'isCurrent'
>;

export type WorkflowRevisionListQuery = {
  summary?: boolean;
  limit?: number;
};

export type WorkflowToolBindingDto = {
  toolId: number;
  isRequired?: boolean;
};

export type WorkflowHostToolBindingDto = {
  hostToolId: number;
  isRequired?: boolean;
};

export type CreateWorkflowDto = {
  appClientId: number;
  workflowKey: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  profile: WorkflowProfile;
  deliverable?: WorkflowDeliverable;
  preset?: WorkflowPresetKind;
  presetConfig?: WorkflowPresetConfig;
  /** 手配须传 { nodes, edges, entryNodeId? }；Preset 路径勿传 */
  nodes?: WorkflowNodesDocument;
  constraints?: string[];
  isActive?: boolean;
  sortOrder?: number;
  tools?: WorkflowToolBindingDto[];
  hostTools?: WorkflowHostToolBindingDto[];
  changeNote?: string;
};

export type UpdateWorkflowDto = {
  name?: string;
  description?: string | null;
  goal?: string | null;
  deliverable?: WorkflowDeliverable;
  preset?: WorkflowPresetKind;
  presetConfig?: WorkflowPresetConfig;
  /** 手配须传 { nodes, edges, entryNodeId? }；Preset 路径勿传 */
  nodes?: WorkflowNodesDocument;
  constraints?: string[];
  isActive?: boolean;
  sortOrder?: number;
  tools?: WorkflowToolBindingDto[];
  hostTools?: WorkflowHostToolBindingDto[];
  changeNote?: string;
};

export type WorkflowListQuery = {
  page?: number;
  pageSize?: number;
  profile?: WorkflowProfile;
  isActive?: boolean;
  keyword?: string;
};

export type WorkflowOverrides = Record<string, { objective?: string }>;

export type FetchDataNodeInput = {
  toolId: number;
  completeWhen?: 'first_success' | 'fetch_all_pages';
};

export type GenerateAndPushNodeInput = {
  hostToolId: number;
  stream?: boolean;
};

export type WorkflowValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type ApiValidationError = {
  code: string;
  message: string;
  issues?: WorkflowValidationIssue[];
  workflowId?: number;
  skillId?: number;
  pageActionId?: number;
};

export type WorkflowBindingValue = {
  workflowId?: number | null;
  workflowVersion?: number | null;
  workflowOverrides?: WorkflowOverrides | null;
};
