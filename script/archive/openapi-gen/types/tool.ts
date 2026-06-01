// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: src/types/api-gen/ — merge into src/types/ manually when ready
// Source: http://localhost:3030/docs-json

export interface InitToolSchemasFromDebugDto {
  /**
   * 请求参数：用于 path 占位符、OpenAPI query/header 参数及 JSON body（与 Agent 调用 tool 时 input 一致）
   * @example {"orderId":"10001","page":1}
   */
  parameters?: object;
  /**
   * 自定义请求头；同名键会覆盖默认头（含 Authorization）
   * @example {"X-Tenant-Id":"demo","Authorization":"Bearer debug-token"}
   */
  headers?: object;
  /** 调试时临时覆盖 Integration 系统 apiKey（未传则使用库中配置） */
  apiKey?: string;
  /**
   * 本次调试超时（毫秒）；未传则使用工具 timeout 或默认 10000
   * @example 10000
   */
  timeoutMs?: number;
  /**
   * 是否将推断结果写回 Tool.outputSchema / Tool.responseProfile
   * @default true
   */
  persist?: boolean;
  /**
   * 补充说明，帮助大模型判断哪些字段应作为 coreFields
   * @example "这是商品详情接口，status 和 seoList 很重要"
   */
  hint?: string;
}

export interface ToolControllerFindPageParams {
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
  /** 工具 ID（精确） */
  id?: number;
  /** AppClient ID（精确） */
  appClientId?: number;
  /**
   * 业务能力键 definitionKey（精确）
   * @example "order.get.api.orders"
   */
  definitionKey?: string;
  /** Integration ID（精确） */
  integrationId?: number;
  /** 工具分类 ID（精确） */
  toolCategoryId?: number;
  /**
   * 是否未归类（toolCategoryId 为 null）
   * @example false
   */
  toolCategoryIdIsNull?: boolean;
  /** 名称（模糊，忽略大小写） */
  name?: string;
  /** 描述（模糊，忽略大小写） */
  description?: string;
  /** 路径（模糊，忽略大小写） */
  path?: string;
  /** 关键词：匹配 name / description / path */
  keyword?: string;
  /** 风险等级 */
  riskLevel?: "L1" | "L2" | "L3";
  /** HTTP 方法 */
  method?: "Get" | "Post" | "Put" | "Delete";
  /** 是否启用 */
  isActive?: boolean;
  /**
   * 排序字段
   * @default "id"
   */
  orderBy?: "id" | "name" | "createdAt" | "updatedAt" | "riskLevel" | "path";
  /**
   * 排序方向
   * @default "desc"
   */
  order?: "asc" | "desc";
}
