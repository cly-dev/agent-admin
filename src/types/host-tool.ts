export type HostToolSkillTrigger =
  | 'ON_MUTATION_SUCCESS'
  | 'ON_PLAN_STEP'
  | 'LLM_SCOPED';

/** 列表 / 嵌套引用用的轻量 Host Tool 摘要 */
export type HostToolSummary = {
  id: number;
  name: string;
  pageScope: string | null;
  definitionKey?: string;
  description?: string;
  isActive?: boolean;
  argsSchema?: unknown;
};

export type HostTool = {
  id: number;
  appClientId: number;
  appClientName?: string;
  hostPageId?: number | null;
  pageScope?: string | null;
  pageLabel?: string | null;
  definitionKey: string;
  name: string;
  description: string;
  argsSchema: unknown;
  argsTemplate?: unknown | null;
  sortOrder?: number;
  isActive?: boolean;
  config?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  bound?: boolean;
};

/** AgentHostTool 中间表 + 嵌套 HostTool */
export type AgentHostToolRef = {
  bindingId: number;
  agentId?: number;
  hostToolId: number;
  hostTool: HostToolSummary;
};

/** SkillHostTool 中间表 + 嵌套 HostTool（详情接口） */
export type SkillHostToolBindingRecord = {
  bindingId: number;
  skillId?: number;
  hostToolId: number;
  trigger: HostToolSkillTrigger | string;
  priority: number;
  isRequired: boolean;
  skillArgsTemplate: unknown | null;
  hostTool: HostToolSummary;
};

export type CreateHostToolDto = {
  appClientId: number;
  hostPageId?: number | null;
  definitionKey: string;
  name: string;
  description: string;
  argsSchema: Record<string, unknown>;
  argsTemplate?: Record<string, unknown> | null;
  sortOrder?: number;
  isActive?: boolean;
  config?: Record<string, unknown> | null;
};

export type UpdateHostToolDto = {
  hostPageId?: number | null;
  definitionKey?: string;
  name?: string;
  description?: string;
  argsSchema?: Record<string, unknown>;
  argsTemplate?: Record<string, unknown> | null;
  sortOrder?: number;
  isActive?: boolean;
  config?: Record<string, unknown> | null;
};

export type HostToolControllerFindByAppClientParams = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  scope?: string;
  genericOnly?: boolean;
  isActive?: boolean;
};

export type BindAgentHostToolsDto = {
  hostToolIds: number[];
};

export type SkillHostToolBindingItemDto = {
  hostToolId: number;
  trigger?: HostToolSkillTrigger;
  argsTemplate?: Record<string, unknown> | null;
  priority?: number;
  isRequired?: boolean;
};

export type ReplaceSkillHostToolsDto = {
  tools: SkillHostToolBindingItemDto[];
};

export type SkillHostToolBinding = HostTool & {
  bindingId?: number;
  hostToolId?: number;
  trigger?: HostToolSkillTrigger | string;
  priority?: number;
  isRequired?: boolean;
  skillArgsTemplate?: unknown | null;
  hostTool?: HostToolSummary;
};

export type AgentHostToolsBindingResult = {
  hostTools: HostTool[];
  agentHostTools: AgentHostToolRef[];
};

export type SkillHostToolsBindingResult = {
  hostTools: HostToolSummary[];
  skillHostTools: SkillHostToolBindingRecord[];
};
