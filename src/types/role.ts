import type { PageResult } from '@/types/integration';

export const ROLE_TOOL_LEVELS = ['L1', 'L2', 'L3'] as const;

export type RoleToolLevel = (typeof ROLE_TOOL_LEVELS)[number];

export interface Role {
  id: number;
  name: string;
  description?: string;
  allowToolLevel: RoleToolLevel;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  allowToolLevel?: RoleToolLevel;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  allowToolLevel?: RoleToolLevel;
}

export interface RoleControllerFindPageParams {
  page?: number;
  pageSize?: number;
  id?: number;
  name?: string;
  keyword?: string;
  allowToolLevel?: RoleToolLevel;
  orderBy?: 'id' | 'name' | 'allowToolLevel' | 'createdAt';
  order?: 'asc' | 'desc';
}

export type RolePageResult = PageResult<Role>;
