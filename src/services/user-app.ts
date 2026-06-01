// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Hand-maintained — OpenAPI stubs: script/archive/openapi-gen/services/
// Source: http://localhost:3030/docs-json

import { http } from "@/utils/request";
import type {
  AddUserToAppDto,
  CreateUserAppDto,
  UserAppRelation,
  UpdateUserAppDto,
} from '@/types/user-app';

function normalizeUserAppRelation(raw: unknown): UserAppRelation {
  if (typeof raw !== 'object' || raw === null) {
    return { id: 0, userId: 0, appId: 0, roleId: 0 };
  }
  const item = raw as Record<string, unknown>;
  const userRaw =
    typeof item.user === 'object' && item.user !== null
      ? (item.user as Record<string, unknown>)
      : undefined;
  const appRaw =
    typeof item.app === 'object' && item.app !== null
      ? (item.app as Record<string, unknown>)
      : typeof item.appClient === 'object' && item.appClient !== null
        ? (item.appClient as Record<string, unknown>)
        : undefined;
  const roleRaw =
    typeof item.role === 'object' && item.role !== null
      ? (item.role as Record<string, unknown>)
      : undefined;

  return {
    id: Number(item.id ?? 0) || 0,
    userId: Number(item.userId ?? item.user_id ?? userRaw?.id ?? 0) || 0,
    appId: Number(item.appId ?? item.app_id ?? appRaw?.id ?? 0) || 0,
    roleId: Number(item.roleId ?? item.role_id ?? roleRaw?.id ?? 0) || 0,
    userEmail:
      typeof item.userEmail === 'string'
        ? item.userEmail
        : typeof userRaw?.email === 'string'
          ? userRaw.email
          : undefined,
    username:
      typeof item.username === 'string'
        ? item.username
        : typeof userRaw?.username === 'string'
          ? userRaw.username
          : undefined,
    appName:
      typeof item.appName === 'string'
        ? item.appName
        : typeof item.appClientName === 'string'
          ? item.appClientName
        : typeof appRaw?.name === 'string'
          ? appRaw.name
          : undefined,
    roleName:
      typeof item.roleName === 'string'
        ? item.roleName
        : typeof roleRaw?.name === 'string'
          ? roleRaw.name
          : undefined,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
  };
}

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'object' || raw === null) return [];
  const payload = raw as Record<string, unknown>;
  const nested =
    typeof payload.data === 'object' && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : payload;
  const list = nested.list ?? nested.items ?? nested.records ?? nested.rows ?? nested;
  return Array.isArray(list) ? list : [];
}

/**
 * 查询用户应用关系列表
 * @tags user-app
 */
export async function UserAppController_findAll(): Promise<UserAppRelation[]> {
  const response = await http.get<unknown>("admin/user-app");
  return unwrapList(response).map(normalizeUserAppRelation);
}

/**
 * 创建用户应用关系
 * @tags user-app
 */
export async function UserAppController_create(data: CreateUserAppDto): Promise<UserAppRelation> {
  const response = await http.post<unknown>("admin/user-app", data);
  return normalizeUserAppRelation(response);
}

/**
 * 向应用添加用户
 * @tags user-app
 */
export async function UserAppController_addUser(
  appId: number,
  data: AddUserToAppDto,
): Promise<UserAppRelation> {
  const response = await http.post<unknown>(`admin/user-app/app/${appId}/users`, data);
  return normalizeUserAppRelation(response);
}

/**
 * 按 ID 查询用户应用关系
 * @tags user-app
 */
export async function UserAppController_findOne(id: number): Promise<UserAppRelation> {
  const response = await http.get<unknown>(`admin/user-app/${id}`);
  return normalizeUserAppRelation(response);
}

/**
 * 按 ID 更新用户应用关系
 * @tags user-app
 */
export async function UserAppController_update(
  id: number,
  data: UpdateUserAppDto,
): Promise<UserAppRelation> {
  const response = await http.patch<unknown>(`admin/user-app/${id}`, data);
  return normalizeUserAppRelation(response);
}

/**
 * 按 ID 删除用户应用关系
 * @tags user-app
 */
export function UserAppController_remove(id: number) {
  return http.delete<void>(`admin/user-app/${id}`);
}
