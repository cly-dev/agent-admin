export type AdminRole = 'SUPER_ADMIN' | 'OPERATOR' | 'VIEWER';

export interface LoginAdminUserDto {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  role?: AdminRole;
  isActive?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  employeeId?: string;
  nickName?: string;
}

export interface LoginAdminUserResponse {
  accessToken: string;
  user: AuthUser;
  mustChangePassword: boolean;
}

export interface AdminUserProfile {
  id: number;
  employeeId: string;
  email: string;
  username: string;
  nickName: string;
  role: AdminRole;
  active: boolean;
  mustChangePassword: boolean;
}

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  role: AdminRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: AdminRole;
  isActive?: boolean;
  orderBy?: 'id' | 'email' | 'username' | 'role' | 'createdAt';
  order?: 'asc' | 'desc';
  id?: number;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateAdminUserDto {
  email: string;
  username: string;
  role: AdminRole;
  isActive?: boolean;
}

export interface UpdateAdminUserDto {
  email?: string;
  username?: string;
  role?: AdminRole;
  isActive?: boolean;
}

export interface CreateAdminUserResponse {
  admin: AdminUser;
  generatedPassword: string;
}

export interface ResetAdminPasswordResponse {
  admin: AdminUser;
  generatedPassword: string;
}

export interface ChangeAdminPasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeAdminPasswordResponse {
  ok: boolean;
}
