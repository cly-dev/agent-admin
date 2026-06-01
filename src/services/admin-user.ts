// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Hand-maintained — OpenAPI stubs: script/archive/openapi-gen/services/
// Source: http://localhost:3030/docs-json

import { http } from '@/utils/request';
import type { LoginAdminUserDto, LoginAdminUserResponse } from '@/types/admin-user';

/**
 * 管理员登录
 * @tags admin-user
 */
export function AdminUserController_login(data: LoginAdminUserDto): Promise<LoginAdminUserResponse> {
  return http.post<LoginAdminUserResponse>('admin/admin-user/login', data);
}
