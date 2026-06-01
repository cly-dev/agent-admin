// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Hand-maintained — OpenAPI stubs: script/archive/openapi-gen/services/
// Source: http://localhost:3030/docs-json

import { http } from '@/utils/request';
import type { AppClient, CreateAppClientDto, UpdateAppClientDto } from '@/types/admin-app-client';

/**
 * 管理员查询 AppClient 列表
 * @tags admin-app-client
 */
export function AppClientController_findAll() {
  return http.get<AppClient[]>('admin/app-client');
}

/**
 * 管理员创建业务 AppClient
 * @tags admin-app-client
 */
export function AppClientController_create(data: CreateAppClientDto) {
  return http.post<AppClient>('admin/app-client', data);
}

/**
 * 管理员按 ID 查询 AppClient
 * @tags admin-app-client
 */
export function AppClientController_findOne(id: number) {
  return http.get<AppClient>(`admin/app-client/${id}`);
}

/**
 * 管理员按 ID 更新 AppClient
 * @tags admin-app-client
 */
export function AppClientController_update(id: number, data: UpdateAppClientDto) {
  return http.patch<AppClient>(`admin/app-client/${id}`, data);
}

/**
 * 管理员按 ID 删除 AppClient
 * @tags admin-app-client
 */
export function AppClientController_remove(id: number) {
  return http.delete<void>(`admin/app-client/${id}`);
}
