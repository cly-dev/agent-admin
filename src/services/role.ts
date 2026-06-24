import type {
  CreateRoleDto,
  Role,
  RoleControllerFindPageParams,
  RolePageResult,
  RoleToolLevel,
  UpdateRoleDto,
} from '@/types/role';
import { ROLE_TOOL_LEVELS } from '@/types/role';
import { normalizePageResult } from '@/utils/api-page';
import { http } from '@/utils/request';

const ROLE_BASE = 'admin/role';

function isRoleToolLevel(value: unknown): value is RoleToolLevel {
  return (
    typeof value === 'string' &&
    (ROLE_TOOL_LEVELS as readonly string[]).includes(value)
  );
}

function normalizeRole(raw: unknown): Role {
  if (typeof raw !== 'object' || raw === null) {
    return { id: 0, name: '', allowToolLevel: 'L1' };
  }

  const item = raw as Record<string, unknown>;
  const id = Number(item.id ?? 0);
  const levelRaw = item.allowToolLevel ?? item.allow_tool_level;
  const allowToolLevel: RoleToolLevel = isRoleToolLevel(levelRaw)
    ? levelRaw
    : 'L1';

  return {
    id: Number.isFinite(id) ? id : 0,
    name: typeof item.name === 'string' ? item.name : '',
    description:
      typeof item.description === 'string' ? item.description : undefined,
    allowToolLevel,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
  };
}

export async function RoleController_findPage(
  params?: RoleControllerFindPageParams,
): Promise<RolePageResult> {
  const response = await http.get<unknown>(ROLE_BASE, params);
  return normalizePageResult(response, normalizeRole);
}

export async function RoleController_create(
  data: CreateRoleDto,
): Promise<Role> {
  const response = await http.post<unknown>(ROLE_BASE, data);
  return normalizeRole(response);
}

export async function RoleController_findOne(id: number): Promise<Role> {
  const response = await http.get<unknown>(`${ROLE_BASE}/${id}`);
  return normalizeRole(response);
}

export async function RoleController_update(
  id: number,
  data: UpdateRoleDto,
): Promise<Role> {
  const response = await http.patch<unknown>(`${ROLE_BASE}/${id}`, data);
  return normalizeRole(response);
}

export function RoleController_remove(id: number) {
  return http.delete<void>(`${ROLE_BASE}/${id}`);
}
