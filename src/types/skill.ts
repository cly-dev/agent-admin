import type {
  HostToolSummary,
  SkillHostToolBindingRecord,
} from '@/types/host-tool';

export interface CreateSkillDto {
  /**
   * Skill 名称（同一 Agent 内唯一）
   * @example "订单查询"
   */
  name: string;
  /** 命中后注入 LLM 的业务指引文案 */
  prompt: string;
  /**
   * 能力键（同一 Agent 内唯一，可选）
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
  /** 初始关联工具（须为 Agent 已绑定的 Tool） */
  tools?: SkillToolBindingItemDto[];
}

export interface UpdateSkillDto {
  /** 更换所属 Agent（须为同一 AppClient 下） */
  agentId?: number;
  /** Skill 名称（同一 Agent 内唯一） */
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
}

export type SkillRiskLevel = 'L1' | 'L2' | 'L3';

export interface ReplaceSkillToolsDto {
  /** Skill 关联工具列表（全量替换；须为 Agent 已绑定的 Tool） */
  tools: SkillToolBindingItemDto[];
}

export interface SkillToolBindingItemDto {
  /**
   * Tool ID（须已绑定到该 Agent）
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

/** Skill 列表项 / 详情（含嵌套 agent、appClient） */
export interface Skill {
  id: number;
  agentId: number;
  appClientId?: number;
  appClientName?: string;
  agentName?: string;
  name: string;
  prompt: string;
  capabilityKey?: string;
  description?: string;
  config?: Record<string, unknown>;
  riskLevel?: SkillRiskLevel;
  /** 由 riskLevel 推导，只读展示 */
  requiresWriteConfirmation?: boolean;
  isActive?: boolean;
  toolCount?: number;
  hostToolCount?: number;
  createdAt?: string;
  updatedAt?: string;
  agent?: SkillRef;
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
