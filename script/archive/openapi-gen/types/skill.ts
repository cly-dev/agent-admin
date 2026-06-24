// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/types/ — merge into src/types/ manually when ready
// Source: http://localhost:3030/docs-json

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
  /**
   * 是否启用
   * @default true
   */
  isActive?: boolean;
  /** 初始关联工具（须为 Agent 已绑定的 Tool） */
  tools?: SkillToolBindingItemDto[];
}

export interface UpdateSkillDto {
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
  /** 是否启用 */
  isActive?: boolean;
}

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
  /**
   * 页码，从 1 开始
   * @default 1
   * @example 1
   */
  page?: number;
  /**
   * 每页条数，最大 100
   * @default 20
   * @example 20
   */
  pageSize?: number;
  /** Skill ID（精确） */
  id?: number;
  /** 名称（模糊，忽略大小写） */
  name?: string;
  /** 能力键（模糊，忽略大小写） */
  capabilityKey?: string;
  /** 关键词：匹配 name / description / capabilityKey */
  keyword?: string;
  /** 是否启用 */
  isActive?: boolean;
  /**
   * 排序字段
   * @default "createdAt"
   */
  orderBy?:
    | 'id'
    | 'name'
    | 'capabilityKey'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt';
  /**
   * 排序方向
   * @default "desc"
   */
  order?: 'asc' | 'desc';
  agentId: number;
  appClientId: number;
}

export interface SkillControllerFindByAppClientParams {
  /**
   * 页码，从 1 开始
   * @default 1
   * @example 1
   */
  page?: number;
  /**
   * 每页条数，最大 100
   * @default 20
   * @example 20
   */
  pageSize?: number;
  /** 按 Agent 筛选（仅 GET /skill/by-app-client/:appClientId） */
  agentId?: number;
  /** Skill ID（精确） */
  id?: number;
  /** 名称（模糊，忽略大小写） */
  name?: string;
  /** 能力键（模糊，忽略大小写） */
  capabilityKey?: string;
  /** 关键词：匹配 name / description / capabilityKey */
  keyword?: string;
  /** 是否启用 */
  isActive?: boolean;
  /**
   * 排序字段
   * @default "createdAt"
   */
  orderBy?:
    | 'id'
    | 'name'
    | 'capabilityKey'
    | 'isActive'
    | 'createdAt'
    | 'updatedAt';
  /**
   * 排序方向
   * @default "desc"
   */
  order?: 'asc' | 'desc';
  appClientId: number;
}
