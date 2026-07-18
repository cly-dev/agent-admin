import type { IntegrationAuthMode } from '@/types/integration';
import type { AgentMetadata } from '@/types/tool-agent-metadata';

export type ToolRiskLevel = 'L1' | 'L2' | 'L3';
export type ToolHttpMethod = 'Get' | 'Post' | 'Put' | 'Delete';
export type ToolStatus = 'active' | 'inactive' | 'config_required';

/** inputSchema / schema：OpenAPI 风格 parameters 列表 */
export type ToolInputSchemaPayload = {
  parameters?: Record<string, unknown>[];
  requestBody?: unknown;
};

export interface ToolIntegrationRef {
  id: number;
  name: string;
  baseUrl?: string;
  authMode?: IntegrationAuthMode;
  systemConfigured?: boolean;
}

export interface ToolCategoryRef {
  id: number;
  label: string;
}

/** 结构化字段投影（coreFields / listMetaFields / optionalFields） */
export type ToolProfileField = {
  path: string;
  label?: string;
  description?: string;
  keywords?: string[];
  enumLabels?: Record<string, string>;
};

/** 大模型响应摘要：coreFields 可为字段路径字符串或结构化对象 */
export type ToolCoreField = string | ToolProfileField;

export type ToolDecisionRole =
  | 'read-detail'
  | 'read-list'
  | 'read-stats'
  | 'write-single'
  | 'write-batch'
  | 'write-meta'
  | 'admin';

/** 数组截断：按列表键限制条数，如 { list: 50 } */
export type ToolArrayLimits = Record<string, number>;

export interface ToolResponseProfile {
  entityType?: string;
  decisionRole?: ToolDecisionRole | string;
  listPath?: string;
  coreFields?: ToolCoreField[];
  listMetaFields?: ToolProfileField[];
  optionalFields?: ToolCoreField[];
  arrayLimits?: ToolArrayLimits;
  [key: string]: unknown;
}

export interface Tool {
  id: number;
  appClientId: number;
  name: string;
  /** 业务能力键：同一 AppClient 内唯一，跨环境对齐 */
  definitionKey?: string;
  description: string;
  riskLevel: ToolRiskLevel;
  method: ToolHttpMethod;
  path: string;
  integrationId: number;
  toolCategoryId?: number;
  isActive: boolean;
  timeout?: number;
  schema?: ToolInputSchemaPayload;
  inputSchema?: ToolInputSchemaPayload;
  outputSchema?: object;
  responseProfile?: ToolResponseProfile;
  /** Agent 选工具元数据 */
  agentMetadata?: AgentMetadata | null;
  integration?: ToolIntegrationRef;
  toolCategory?: ToolCategoryRef;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateToolDto {
  /**
   * 所属 AppClient ID
   * @example 1
   */
  appClientId: number;
  /**
   * 工具名称（唯一标识，供 LLM tool_call）
   * @example "getOrderList"
   */
  name: string;
  /**
   * 业务能力键：同一 AppClient 内唯一，用于跨系统对齐；未传则服务端自动生成
   * @example "order.get.getOrderList"
   */
  definitionKey?: string;
  /** 工具描述 */
  description: string;
  /**
   * 风险等级
   * @default "L1"
   */
  riskLevel?: ToolRiskLevel;
  /** OpenAPI 参数备用 */
  schema: ToolInputSchemaPayload;
  /** LLM + HTTP 拆参（运行时优先） */
  inputSchema: ToolInputSchemaPayload;
  /** outputSchema */
  outputSchema?: object;
  /** HTTP 方法 */
  method: ToolHttpMethod;
  /**
   * API 路径
   * @example "/api/orders"
   */
  path: string;
  /**
   * 关联 Integration ID
   * @example 1
   */
  integrationId: number;
  /**
   * 工具分类 ID
   * @example 1
   */
  toolCategoryId?: number;
  /**
   * 是否启用
   * @default true
   */
  isActive?: boolean;
  /**
   * 超时毫秒数
   * @example 10000
   */
  timeout?: number;
  agentMetadata?: AgentMetadata | null;
}

export interface UpdateToolDto {
  appClientId?: number;
  name?: string;
  definitionKey?: string;
  description?: string;
  riskLevel?: ToolRiskLevel;
  schema?: ToolInputSchemaPayload;
  inputSchema?: ToolInputSchemaPayload;
  outputSchema?: object;
  responseProfile?: ToolResponseProfile;
  method?: ToolHttpMethod;
  path?: string;
  integrationId?: number;
  toolCategoryId?: number;
  isActive?: boolean;
  timeout?: number;
  agentMetadata?: AgentMetadata | null;
}

export interface BatchSetToolsActiveDto {
  /** 工具 ID 列表 */
  ids: number[];
  /** 目标启用状态：true 批量启用，false 批量禁用 */
  isActive: boolean;
}

export interface BatchSetToolsActiveResult {
  updatedCount?: number;
  notFoundIds?: number[];
}

export interface DebugToolDto {
  parameters?: object;
  headers?: object;
  apiKey?: string;
  timeoutMs?: number;
}

export interface DebugToolResult {
  ok?: boolean;
  statusCode?: number;
  durationMs?: number;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  error?: string;
}

export interface InitToolSchemasFromDebugDto {
  parameters?: object;
  headers?: object;
  apiKey?: string;
  timeoutMs?: number;
  /** 是否将推断结果写回 Tool；推荐默认 false，预览后再应用 */
  persist?: boolean;
  /** 补充说明，帮助大模型判断哪些字段应作为 coreFields */
  hint?: string;
}

export interface InitToolSchemasFromDebugResult {
  debug?: DebugToolResult;
  outputSchema?: Record<string, unknown> | object;
  responseProfile?: ToolResponseProfile;
  agentMetadata?: AgentMetadata | null;
  source?: 'llm' | 'fallback' | string;
  agentMetadataSource?: 'llm' | 'heuristic' | 'existing' | string;
  persisted?: boolean;
  tool?: Tool;
  adjustments?: Array<{ code?: string; message?: string } | string>;
}

export interface ToolControllerFindPageParams {
  page?: number;
  pageSize?: number;
  id?: number;
  appClientId?: number;
  integrationId?: number;
  toolCategoryId?: number;
  toolCategoryIdIsNull?: boolean;
  name?: string;
  description?: string;
  path?: string;
  keyword?: string;
  riskLevel?: ToolRiskLevel;
  method?: ToolHttpMethod;
  isActive?: boolean;
  orderBy?: 'id' | 'name' | 'createdAt' | 'updatedAt' | 'riskLevel' | 'path';
  order?: 'asc' | 'desc';
}

/** 从 Swagger/OpenAPI URL 批量导入工具（POST admin/tool/import/swagger） */
export interface ImportToolsFromSwaggerDto {
  /** OpenAPI JSON 文档地址 */
  specUrl: string;
  /** 使用已有 Integration ID（与 autoIntegration 二选一） */
  integrationId?: number;
  /** 自动按 spec servers[0] 创建/复用 Integration */
  autoIntegration?: boolean;
  /** autoIntegration 时必填：Integration 所属 AppClient */
  appClientId?: number;
  /** 导入后绑定到 Agent（可选） */
  agentId?: number;
  integrationName?: string;
  integrationBaseUrl?: string;
  integrationApiKey?: string;
  integrationAuthMode?: IntegrationAuthMode;
  /** 仅解析不写库 */
  dryRun?: boolean;
  riskLevel?: ToolRiskLevel;
  tags?: string[];
  ops?: string[];
  pathInclude?: string[];
  pathExclude?: string[];
  noDefaultPathExclude?: boolean;
  insecure?: boolean;
}

export interface ToolControllerFindByAppClientParams {
  page?: number;
  pageSize?: number;
  id?: number;
  integrationId?: number;
  toolCategoryId?: number;
  toolCategoryIdIsNull?: boolean;
  name?: string;
  description?: string;
  path?: string;
  keyword?: string;
  riskLevel?: ToolRiskLevel;
  method?: ToolHttpMethod;
  isActive?: boolean;
  orderBy?: 'id' | 'name' | 'createdAt' | 'updatedAt' | 'riskLevel' | 'path';
  order?: 'asc' | 'desc';
  /** Query 中的 AppClient ID（路径参数优先） */
  appClientId?: number;
}
