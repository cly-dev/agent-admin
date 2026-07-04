import type { AdminRole, AuthUser } from '@/types/admin-user';

export function isSuperAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === 'SUPER_ADMIN';
}

export function isOperatorOrAbove(user: AuthUser | null | undefined): boolean {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'OPERATOR';
}

export function getAdminRoleLabelKey(role: AdminRole): string {
  return `adminUser.role.${role}`;
}
