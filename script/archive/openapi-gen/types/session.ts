// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: src/types/api-gen/ — merge into src/types/ manually when ready
// Source: http://localhost:3030/docs-json

export interface CreateSessionDto {
  /**
   * Session ID（可选；不传则自动生成 32 位十六进制）
   * @example "1f8a4b2c9d0e11a2b3c4d5e6f7a8b9c0"
   */
  id?: string;
  /**
   * 用户 ID
   * @example 1
   */
  userId: number;
  /**
   * Agent ID（可选）
   * @example 1
   */
  agentId?: number;
  /**
   * 会话标题
   * @example "订单问题咨询"
   */
  title?: string;
}

export interface UpdateSessionDto {
  /**
   * 用户 ID
   * @example 1
   */
  userId?: number;
  /**
   * Agent ID（可选）
   * @example 1
   */
  agentId?: number;
  /**
   * 会话标题
   * @example "订单问题咨询"
   */
  title?: string;
}
