// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/types/ — merge into src/types/ manually when ready
// Source: http://localhost:3030/docs-json

export interface MessageTurnControllerFindPageBySessionIdParams {
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
  /** MessageTurn ID（精确） */
  id?: number;
  /** 触发 Message ID（精确） */
  messageId?: number;
  /** User ID（精确） */
  userId?: number;
  /** AppClient ID（精确） */
  appClientId?: number;
  /** Primary Agent ID（精确） */
  primaryAgentId?: number;
  /** 运行状态 */
  status?: 'running' | 'success' | 'failed';
  /** 用户输入（模糊，忽略大小写） */
  userInput?: string;
  /** 关键词：匹配 userInput / finalOutput */
  keyword?: string;
  /** 工具 low 质量最小次数（基于 toolsUsed.qualityCounts.low） */
  minLowQualityCount?: number;
  /**
   * 排序字段
   * @default "id"
   */
  orderBy?:
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'startedAt'
    | 'finishedAt'
    | 'durationMs'
    | 'totalTokens';
  /**
   * 排序方向
   * @default "desc"
   */
  order?: 'asc' | 'desc';
  sessionId: string;
}
