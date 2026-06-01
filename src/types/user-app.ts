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

export interface UserAppRelation {
  id: number;
  userId: number;
  appId: number;
  roleId: number;
  userEmail?: string;
  username?: string;
  appName?: string;
  roleName?: string;
  createdAt?: string;
  updatedAt?: string;
}
