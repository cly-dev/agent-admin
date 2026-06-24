// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/types/ — merge into src/types/ manually when ready
// Source: http://localhost:3030/docs-json

export interface CreateUserDto {
  /**
   * 用户邮箱（用于登录）
   * @example "alice@example.com"
   */
  email: string;
  /**
   * 用户名
   * @example "alice"
   */
  username: string;
  /**
   * 工号（业务系统唯一标识）；未传时系统自动生成
   * @example "YT20220217"
   */
  employeeId?: string;
}

export interface UpdateUserDto {
  /**
   * 用户邮箱
   * @example "alice@example.com"
   */
  email?: string;
  /**
   * 新密码（会加密存储）
   * @example "new-pass123456"
   */
  password?: string;
  /**
   * 用户名
   * @example "alice-new"
   */
  username?: string;
}
