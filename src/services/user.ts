// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Hand-maintained — OpenAPI stubs: script/archive/openapi-gen/services/
// Source: http://localhost:3030/docs-json

import { http } from "@/utils/request";
import type { CreateUserDto, UpdateUserDto, User } from '@/types/user';

function normalizeUser(raw: unknown): User {
  if (typeof raw !== 'object' || raw === null) {
    return { id: 0, email: '', username: '' };
  }
  const item = raw as Record<string, unknown>;
  return {
    id: Number(item.id ?? 0) || 0,
    email: typeof item.email === 'string' ? item.email : '',
    username: typeof item.username === 'string' ? item.username : '',
    employeeId: typeof item.employeeId === 'string' ? item.employeeId : undefined,
    userType: item.userType as User['userType'],
    userRole: item.userRole as User['userRole'],
    role: typeof item.role === 'string' ? item.role : undefined,
    roleId:
      typeof item.roleId === 'number' ? item.roleId : item.roleId === null ? null : undefined,
    isActive: typeof item.isActive === 'boolean' ? item.isActive : undefined,
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
 * 查询用户列表
 * @tags user
 */
export async function UserController_findAll(): Promise<User[]> {
  const response = await http.get<unknown>("admin/user");
  return unwrapList(response).map(normalizeUser);
}

/**
 * 创建用户
 * @tags user
 */
export function UserController_create(data: CreateUserDto) {
  return http.post<void>("admin/user", data);
}

/**
 * 检查是否需要首次修改密码
 * @tags user
 */
export function UserController_getPasswordReminder() {
  return http.get<void>("admin/user/password-reminder");
}

/**
 * 按角色查询用户可用工具
 * @tags user
 */
export function UserController_getAllowedTools(id: number) {
  return http.get<void>(`admin/user/${id}/allowed-tools`);
}

/**
 * 查询单个用户
 * @tags user
 */
export async function UserController_findOne(id: number): Promise<User> {
  const response = await http.get<unknown>(`admin/user/${id}`);
  return normalizeUser(response);
}

/**
 * 更新用户信息
 * @tags user
 */
export function UserController_update(id: number, data: UpdateUserDto) {
  return http.patch<void>(`admin/user/${id}`, data);
}

/**
 * 删除用户
 * @tags user
 */
export function UserController_remove(id: number) {
  return http.delete<void>(`admin/user/${id}`);
}
