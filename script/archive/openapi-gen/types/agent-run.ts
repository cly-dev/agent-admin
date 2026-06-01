// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: src/types/api-gen/ — merge into src/types/ manually when ready
// Source: http://localhost:3030/docs-json

export interface CreateAgentRunDto {
  /**
   * 关联 SessionTurn ID（可选）
   * @example 1
   */
  turnId?: number;
  /**
   * Agent ID
   * @example 1
   */
  agentId: number;
  /**
   * Session ID
   * @example "sess_abc123"
   */
  sessionId: string;
  /**
   * User ID（可选）
   * @example 1
   */
  userId?: number;
  /**
   * 运行角色
   * @default "primary"
   */
  role?: "primary" | "router" | "worker" | "reviewer";
  /**
   * 同一 turn 下执行序号
   * @default 1
   * @example 1
   */
  sequence?: number;
  /**
   * 父 run ID（可选）
   * @example 1
   */
  parentRunId?: number;
  /** 输入内容 */
  input: string;
  /** 输出内容 */
  output?: string;
  /**
   * 运行状态
   * @default "running"
   */
  status?: "running" | "success" | "failed";
  /**
   * 执行步骤 JSON
   * @example []
   */
  steps?: object;
  /**
   * 当前步数
   * @default 0
   * @example 0
   */
  currentStep?: number;
  /**
   * 最大步数
   * @example 8
   */
  maxSteps: number;
  /** 错误信息 */
  error?: string;
  /** 结束原因 */
  finishReason?: string;
}

export interface UpdateAgentRunDto {
  /**
   * 关联 SessionTurn ID（可选）
   * @example 1
   */
  turnId?: number;
  /**
   * Agent ID
   * @example 1
   */
  agentId?: number;
  /**
   * Session ID
   * @example "sess_abc123"
   */
  sessionId?: string;
  /**
   * User ID（可选）
   * @example 1
   */
  userId?: number;
  /** 运行角色 */
  role?: "primary" | "router" | "worker" | "reviewer";
  /**
   * 同一 turn 下执行序号
   * @example 1
   */
  sequence?: number;
  /**
   * 父 run ID（可选）
   * @example 1
   */
  parentRunId?: number;
  /** 输入内容 */
  input?: string;
  /** 输出内容 */
  output?: string;
  /** 运行状态 */
  status?: "running" | "success" | "failed";
  /**
   * 执行步骤 JSON
   * @example []
   */
  steps?: object;
  /**
   * 当前步数
   * @example 0
   */
  currentStep?: number;
  /**
   * 最大步数
   * @example 8
   */
  maxSteps?: number;
  /** 错误信息 */
  error?: string;
  /** 结束原因 */
  finishReason?: string;
}

export interface AgentRunControllerFindPageParams {
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
  /** AgentRun ID（精确） */
  id?: number;
  /** SessionTurn ID（精确） */
  turnId?: number;
  /** Agent ID（精确） */
  agentId?: number;
  /** Session ID（精确） */
  sessionId?: string;
  /** User ID（精确） */
  userId?: number;
  /** 运行角色 */
  role?: "primary" | "router" | "worker" | "reviewer";
  /** 运行状态 */
  status?: "running" | "success" | "failed";
  /** 输入内容（模糊，忽略大小写） */
  input?: string;
  /** 关键词：匹配 input / output / error */
  keyword?: string;
  /**
   * 排序字段
   * @default "id"
   */
  orderBy?: "id" | "sequence" | "createdAt" | "updatedAt" | "startedAt" | "finishedAt" | "durationMs" | "totalTokens";
  /**
   * 排序方向
   * @default "desc"
   */
  order?: "asc" | "desc";
  /** AppClient ID */
  appClientId: number;
}
