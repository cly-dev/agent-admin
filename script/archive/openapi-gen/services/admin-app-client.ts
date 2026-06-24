// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/services/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import type {
  CreateAppClientDto,
  UpdateAppClientDto,
} from '@/types/admin-app-client';
import { http } from '@/utils/request';

/**
 * 管理员查询 AppClient 列表
 * @tags admin-app-client
 */
export function AppClientController_findAll() {
  return http.get<void>('admin/app-client');
}

/**
 * 管理员创建业务 AppClient
 * @tags admin-app-client
 */
export function AppClientController_create(data: CreateAppClientDto) {
  return http.post<void>('admin/app-client', data);
}

/**
 * 管理员按 ID 查询 AppClient
 * @tags admin-app-client
 */
export function AppClientController_findOne(id: number) {
  return http.get<void>(`admin/app-client/${id}`);
}

/**
 * 管理员按 ID 更新 AppClient
 * @tags admin-app-client
 */
export function AppClientController_update(
  id: number,
  data: UpdateAppClientDto,
) {
  return http.patch<void>(`admin/app-client/${id}`, data);
}

/**
 * 管理员按 ID 删除 AppClient
 * @tags admin-app-client
 */
export function AppClientController_remove(id: number) {
  return http.delete<void>(`admin/app-client/${id}`);
}
