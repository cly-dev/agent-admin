export type UserStatus = 'ACTIVE' | 'DISABLED';

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
  /** 用户类型（C 端用户/ B 端业务用户） */
  userType?: 'C_END' | 'B_END';
  /** 业务角色（用于 Tool 子集授权） */
  userRole?: 'C_END_USER' | 'CUSTOMER_SERVICE' | 'OPERATOR';
  /** RBAC 角色 ID（权限设置中的角色） */
  roleId?: number;
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
  /** 用户类型（C 端用户/ B 端业务用户） */
  userType?: 'C_END' | 'B_END';
  /** 业务角色（用于 Tool 子集授权） */
  userRole?: 'C_END_USER' | 'CUSTOMER_SERVICE' | 'OPERATOR';
  /** RBAC 角色 ID */
  roleId?: number | null;
  /** 用户状态 */
  status?: UserStatus;
}

export interface User {
  id: number;
  email: string;
  username: string;
  employeeId?: string;
  userType?: 'C_END' | 'B_END';
  userRole?: 'C_END_USER' | 'CUSTOMER_SERVICE' | 'OPERATOR';
  role?: string;
  roleId?: number | null;
  status?: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}
