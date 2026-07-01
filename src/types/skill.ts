import type {
  HostToolSummary,
  SkillHostToolBindingRecord,
} from '@/types/host-tool';
import type { WorkflowOverrides } from '@/types/workflow';

export interface CreateSkillDto {
  /**
   * Skill 名称（同一 App 内唯一）
   * @example "订单查询"
   */
  name: string;
  /** 命中后注入 LLM 的业务指引文案 */
  prompt: string;
  /**
   * 能力键（同一 App 内唯一，可选）
   * @example "order.inquiry"
   */
  capabilityKey?: string;
  /** 描述 */
  description?: string;
  /** 扩展配置 JSON */
  config?: object;
  /** 风险等级 L1/L2/L3 */
  riskLevel?: SkillRiskLevel;
  /**
   * 是否启用
   * @default true
   */
  isActive?: boolean;
  /** 初始关联工具（须为本 App 下已启用的 Tool） */
  tools?: SkillToolBindingItemDto[];
  workflowId?: number | null;
  workflowVersion?: number | null;
  workflowOverrides?: WorkflowOverrides | null;
}

export interface UpdateSkillDto {
  /** Skill 名称（同一 App 内唯一） */
  name?: string;
  /** 业务指引文案 */
  prompt?: string;
  /**
   * 能力键；传空字符串可清空
   * @example "order.inquiry"
   */
  capabilityKey?: string;
  /** 描述；传空字符串可清空 */
  description?: string;
  /** 扩展配置 JSON */
  config?: object;
  /** 风险等级 L1/L2/L3 */
  riskLevel?: SkillRiskLevel;
  /** 是否启用 */
  isActive?: boolean;
  workflowId?: number | null;
  workflowVersion?: number | null;
  workflowOverrides?: WorkflowOverrides | null;
}

export type SkillRiskLevel = 'L1' | 'L2' | 'L3';

export interface ReplaceSkillToolsDto {
  /** Skill 关联工具列表（全量替换；须为本 App 下已启用的 Tool） */
  tools: SkillToolBindingItemDto[];
}

export interface SkillToolBindingItemDto {
  /**
   * Tool ID（须为本 App 下已启用的 Tool）
   * @example 1
   */
  toolId: number;
  /**
   * 是否为 Skill 激活 gate 的必选工具
   * @default false
   */
  isRequired?: boolean;
}

export interface SkillControllerFindByAgentParams {
  page?: number;
  pageSize?: number;
  id?: number;
  name?: string;
  capabilityKey?: string;
  keyword?: string;
  isActive?: boolean;
  orderBy?:
    | 'id'
    | 'name'
    | 'capabilityKey'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt';
  order?: 'asc' | 'desc';
  agentId: number;
  appClientId: number;
}

export interface SkillControllerFindByAppClientParams {
  page?: number;
  pageSize?: number;
  /** 按 Agent 筛选（仅 GET /skill/by-app-client/:appClientId） */
  agentId?: number;
  id?: number;
  name?: string;
  capabilityKey?: string;
  keyword?: string;
  isActive?: boolean;
  orderBy?:
    | 'id'
    | 'name'
    | 'capabilityKey'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt';
  order?: 'asc' | 'desc';
  appClientId: number;
}

export interface SkillRef {
  id: number;
  name?: string;
}

/** Skill 列表项 / 详情（含嵌套 appClient） */
export interface Skill {
  id: number;
  appClientId: number;
  appClientName?: string;
  /** 被多少 Agent 白名单引用（收紧模式） */
  agentSkillCount?: number;
  name: string;
  prompt: string;
  capabilityKey?: string;
  description?: string;
  config?: Record<string, unknown>;
  riskLevel?: SkillRiskLevel;
  /** 由 riskLevel 推导，只读展示 */
  requiresWriteConfirmation?: boolean;
  isActive?: boolean;
  workflowId?: number | null;
  workflowVersion?: number | null;
  workflowOverrides?: WorkflowOverrides | null;
  workflowName?: string;
  toolCount?: number;
  hostToolCount?: number;
  createdAt?: string;
  updatedAt?: string;
  appClient?: SkillRef;
}

export interface SkillToolBinding {
  id?: number;
  toolId: number;
  isRequired?: boolean;
  name?: string;
  description?: string;
  path?: string;
  method?: string;
  definitionKey?: string;
  isActive?: boolean;
  requiresWriteConfirmation?: boolean;
}

export interface SkillDetail extends Skill {
  tools: SkillToolBinding[];
  skillHostTools?: SkillHostToolBindingRecord[];
  hostTools?: HostToolSummary[];
}
