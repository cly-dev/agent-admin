import type { AgentHostToolRef, HostToolSummary } from '@/types/host-tool';

export interface Agent {
  id: number;
  appClientId: number;
  name: string;
  systemPrompt: string;
  description?: string;
  toolIds?: number[];
  maxSteps?: number;
  enableToolCall?: boolean;
  config?: Record<string, unknown>;
  hostToolCount?: number;
  hostTools?: HostToolSummary[];
  agentHostTools?: AgentHostToolRef[];
  createdAt?: string;
  updatedAt?: string;
}

export type AgentDetail = Agent;

/** Agent 与 Tool 的绑定记录（列表项） */
export interface AgentAllowedToolRef {
  /** 绑定关系 ID（`items[].id`） */
  bindingId: number;
  /** Tool ID（解绑 API 使用） */
  toolId: number;
  name: string;
  description?: string;
  path?: string;
  method?: string;
  definitionKey?: string;
  isActive?: boolean;
}

export interface CreateAgentDto {
  /**
   * 所属 AppClient ID
   * @example 1
   */
  appClientId: number;
  /**
   * Agent 名称
   * @example "Sales Assistant"
   */
  name: string;
  /** 系统提示词 */
  systemPrompt: string;
  /** Agent 描述 */
  description?: string;
  /** 允许调用的工具 ID 列表 */
  toolIds?: number[];
  /**
   * 最大执行步数
   * @example 8
   */
  maxSteps?: number;
  /**
   * 是否启用工具调用
   * @example true
   */
  enableToolCall?: boolean;
  /**
   * 自定义配置 JSON
   * @example {"temperature":0.2}
   */
  config?: object;
}

export interface UpdateAgentDto {
  appClientId?: number;
  name?: string;
  systemPrompt?: string;
  description?: string;
  toolIds?: number[];
  maxSteps?: number;
  enableToolCall?: boolean;
  config?: object;
}

export interface BindAgentToolsDto {
  /**
   * Tool ID 列表（须属于同一 AppClient；用于绑定或解绑）
   * @example [1,2,3]
   */
  toolIds: number[];
}

export interface AgentControllerGetAgentToolsParams {
  page?: number;
  pageSize?: number;
  orderBy?:
    | 'toolId'
    | 'id'
    | 'name'
    | 'createdAt'
    | 'updatedAt'
    | 'riskLevel'
    | 'path';
  order?: 'asc' | 'desc';
  /** 绑定记录 ID */
  id?: number;
  /** Tool ID（精确） */
  toolId?: number;
  /** 业务能力键（精确） */
  definitionKey?: string;
  integrationId?: number;
  toolCategoryId?: number;
  /** 是否未归类 */
  toolCategoryIdIsNull?: boolean;
  /** 名称模糊 */
  name?: string;
  /** 描述模糊 */
  description?: string;
  /** 路径模糊 */
  path?: string;
  /** 匹配 name / description / path */
  keyword?: string;
  riskLevel?: 'L1' | 'L2' | 'L3';
  method?: 'Get' | 'Post' | 'Put' | 'Delete';
  /** 是否启用 */
  isActive?: boolean;
}
