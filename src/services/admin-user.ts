import type {
  AdminUser,
  AdminUserListQuery,
  AdminUserListResponse,
  AdminUserProfile,
  ChangeAdminPasswordDto,
  ChangeAdminPasswordResponse,
  CreateAdminUserDto,
  CreateAdminUserResponse,
  LoginAdminUserDto,
  LoginAdminUserResponse,
  ResetAdminPasswordResponse,
  UpdateAdminUserDto,
} from '@/types/admin-user';
import { http } from '@/utils/request';

export function AdminUserController_login(
  data: LoginAdminUserDto,
): Promise<LoginAdminUserResponse> {
  return http.post<LoginAdminUserResponse>('admin-user/login', data);
}

export function AdminUserController_getMe(): Promise<AdminUserProfile> {
  return http.get<AdminUserProfile>('admin-user/me');
}

export function AdminUserController_changePassword(
  data: ChangeAdminPasswordDto,
): Promise<ChangeAdminPasswordResponse> {
  return http.post<ChangeAdminPasswordResponse>(
    'admin-user/change-password',
    data,
  );
}

export function AdminUserController_findPage(
  query?: AdminUserListQuery,
): Promise<AdminUserListResponse> {
  return http.get<AdminUserListResponse>('admin-user', query);
}

export function AdminUserController_create(
  data: CreateAdminUserDto,
): Promise<CreateAdminUserResponse> {
  return http.post<CreateAdminUserResponse>('admin-user', data);
}

export function AdminUserController_findOne(id: number): Promise<AdminUser> {
  return http.get<AdminUser>(`admin-user/${id}`);
}

export function AdminUserController_update(
  id: number,
  data: UpdateAdminUserDto,
): Promise<AdminUser> {
  return http.patch<AdminUser>(`admin-user/${id}`, data);
}

export function AdminUserController_resetPassword(
  id: number,
): Promise<ResetAdminPasswordResponse> {
  return http.post<ResetAdminPasswordResponse>(
    `admin-user/${id}/reset-password`,
  );
}
