// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/services/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import type {
  CreateRoleDto,
  RoleController_findPageParams,
  UpdateRoleDto,
} from '@/types/role';
import { http } from '@/utils/request';

/**
 * 分页查询角色列表
 * @tags role
 */
export function RoleController_findPage(
  params?: RoleController_findPageParams,
) {
  return http.get<void>('admin/role', params);
}

/**
 * 创建角色
 * @tags role
 */
export function RoleController_create(data: CreateRoleDto) {
  return http.post<void>('admin/role', data);
}

/**
 * 按 ID 查询角色
 * @tags role
 */
export function RoleController_findOne(id: number) {
  return http.get<void>(`admin/role/${id}`);
}

/**
 * 按 ID 更新角色
 * @tags role
 */
export function RoleController_update(id: number, data: UpdateRoleDto) {
  return http.patch<void>(`admin/role/${id}`, data);
}

/**
 * 按 ID 删除角色
 * @tags role
 */
export function RoleController_remove(id: number) {
  return http.delete<void>(`admin/role/${id}`);
}
