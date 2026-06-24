// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/services/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import type { CreateUserDto, UpdateUserDto } from '@/types/admin-user';
import { http } from '@/utils/request';

/**
 * 查询业务用户列表
 * @tags admin-user
 */
export function UserAdminController_findAll() {
  return http.get<void>('admin/user');
}

/**
 * 创建业务用户
 * @tags admin-user
 */
export function UserAdminController_create(data: CreateUserDto) {
  return http.post<void>('admin/user', data);
}

/**
 * 查询单个业务用户
 * @tags admin-user
 */
export function UserAdminController_findOne(id: number) {
  return http.get<void>(`admin/user/${id}`);
}

/**
 * 更新业务用户
 * @tags admin-user
 */
export function UserAdminController_update(id: number, data: UpdateUserDto) {
  return http.patch<void>(`admin/user/${id}`, data);
}

/**
 * 删除业务用户
 * @tags admin-user
 */
export function UserAdminController_remove(id: number) {
  return http.delete<void>(`admin/user/${id}`);
}
