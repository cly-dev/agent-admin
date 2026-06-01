export interface LoginAdminUserDto {
  /**
   * 管理员登录邮箱
   * @example "admin@example.com"
   */
  email: string;
  /**
   * 管理员登录密码
   * @example "strong-pass-123"
   */
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  role?: string;
  roleId?: number | null;
  isActive?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
}

export interface LoginAdminUserResponse {
  accessToken: string;
  user: AuthUser;
  mustChangePassword: boolean;
}
