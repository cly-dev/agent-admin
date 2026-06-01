// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: src/services/api-gen/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import { http } from "@/utils/request";
import type {
  CreateUserAppDto,
  AddUserToAppDto,
  UpdateUserAppDto,
} from "@/types/user-app";

/**
 * 查询用户应用关系列表
 * @tags user-app
 */
export function UserAppController_findAll() {
  return http.get<void>("admin/user-app");
}

/**
 * 创建用户应用关系
 * @tags user-app
 */
export function UserAppController_create(data: CreateUserAppDto) {
  return http.post<void>("admin/user-app", data);
}

/**
 * 向应用添加用户
 * @tags user-app
 */
export function UserAppController_addUser(appId: number, data: AddUserToAppDto) {
  return http.post<void>(`admin/user-app/app/${appId}/users`, data);
}

/**
 * 按 ID 查询用户应用关系
 * @tags user-app
 */
export function UserAppController_findOne(id: number) {
  return http.get<void>(`admin/user-app/${id}`);
}

/**
 * 按 ID 更新用户应用关系
 * @tags user-app
 */
export function UserAppController_update(id: number, data: UpdateUserAppDto) {
  return http.patch<void>(`admin/user-app/${id}`, data);
}

/**
 * 按 ID 删除用户应用关系
 * @tags user-app
 */
export function UserAppController_remove(id: number) {
  return http.delete<void>(`admin/user-app/${id}`);
}
