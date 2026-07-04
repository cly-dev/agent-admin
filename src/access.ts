import type { AuthUser } from '@/types/admin-user';
import { isSuperAdmin } from '@/utils/admin-role';

export default (
  initialState:
    | {
        user?: AuthUser | null;
      }
    | undefined,
) => {
  const user = initialState?.user ?? null;

  return {
    canManageAdminUsers: isSuperAdmin(user),
    canWriteAdmin: user?.role === 'SUPER_ADMIN' || user?.role === 'OPERATOR',
    isViewerOnly: user?.role === 'VIEWER',
  };
};
