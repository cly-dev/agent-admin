// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: src/types/api-gen/ — merge into src/types/ manually when ready
// Source: http://localhost:3030/docs-json

export interface CreateUserAppDto {
  /**
   * 用户 ID
   * @example 1
   */
  userId: number;
  /**
   * 应用 ID（AppClient）
   * @example 1
   */
  appId: number;
  /**
   * 角色 ID（必填）
   * @example 1
   */
  roleId: number;
}

export interface AddUserToAppDto {
  /**
   * 用户 ID
   * @example 1
   */
  userId: number;
  /**
   * 角色 ID（必填）
   * @example 1
   */
  roleId: number;
}

export interface UpdateUserAppDto {
  /**
   * 用户 ID
   * @example 1
   */
  userId?: number;
  /**
   * 应用 ID（AppClient）
   * @example 1
   */
  appId?: number;
  /**
   * 角色 ID
   * @example 1
   */
  roleId?: number;
}
