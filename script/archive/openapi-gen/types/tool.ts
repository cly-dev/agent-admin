// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/types/ — merge into src/types/ manually when ready
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

export interface ImportToolsFromSwaggerDto {
  /**
   * OpenAPI JSON 文档地址（与 swagger-tool-cli 的 --spec-url 一致）
   * @example "https://api.example.com/v3/api-docs"
   */
  specUrl: string;
  /** 使用已有 Integration ID（与 autoIntegration 二选一） */
  integrationId?: number;
  /**
   * 自动按 spec servers[0] 创建/复用 Integration
   * @default false
   */
  autoIntegration?: boolean;
  /** autoIntegration 时必填：Integration 所属 AppClient */
  appClientId?: number;
  /** 导入后绑定到 Agent（可选，写入 agent_tools） */
  agentId?: number;
  /** 自动 Integration 名称（默认 spec.info.title） */
  integrationName?: string;
  /** 自动 Integration baseUrl（默认 servers[0].url） */
  integrationBaseUrl?: string;
  /** 系统级 apiKey（写入 Integration） */
  integrationApiKey?: string;
  /** Integration 鉴权模式 */
  integrationAuthMode?: 'USER_ONLY' | 'SYSTEM_ONLY' | 'USER_PREFERRED';
  /**
   * 仅解析不写库（等同 CLI --dry-run）
   * @default false
   */
  dryRun?: boolean;
  /**
   * 只导入指定 OpenAPI tag（逗号分隔或数组）
   * @example ["order-controller"]
   */
  tags?: string[];
  /**
   * 只导入指定操作，格式 METHOD:/path（逗号分隔或数组）
   * @example ["GET:/api/orders"]
   */
  ops?: string[];
  /** path 须包含任一子串（逗号分隔或数组） */
  pathInclude?: string[];
  /** 排除 path 包含子串的接口（与默认 public/buyer 合并） */
  pathExclude?: string[];
  /**
   * 关闭默认 path 排除（public、buyer）
   * @default false
   */
  noDefaultPathExclude?: boolean;
  /**
   * 下载 spec 时跳过 TLS 证书校验
   * @default false
   */
  insecure?: boolean;
}

export interface BatchSetToolsActiveDto {
  /**
   * 工具 ID 列表
   * @example [1,2,3]
   */
  ids: number[];
  /**
   * 目标启用状态：true 批量启用，false 批量禁用
   * @example false
   */
  isActive: boolean;
}

export interface DebugToolDto {
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
}

export interface ToolControllerFindByAppClientParams {
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
  riskLevel?: 'L1' | 'L2' | 'L3';
  /** HTTP 方法 */
  method?: 'Get' | 'Post' | 'Put' | 'Delete';
  /** 是否启用 */
  isActive?: boolean;
  /**
   * 排序字段
   * @default "id"
   */
  orderBy?: 'id' | 'name' | 'createdAt' | 'updatedAt' | 'riskLevel' | 'path';
  /**
   * 排序方向
   * @default "desc"
   */
  order?: 'asc' | 'desc';
  /** AppClient ID */
  appClientId: number;
}
