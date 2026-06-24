import { AppClientController_findAll } from '@/services/admin-app-client';
import { UserController_findOne, UserController_update } from '@/services/user';
import { UserAppController_findAll } from '@/services/user-app';
import type { AppClient } from '@/types/admin-app-client';
import type { UpdateUserDto, User, UserStatus } from '@/types/user';
import type { UserAppRelation } from '@/types/user-app';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

export type AssignedSystemItem = {
  appId: number;
  name: string;
  roleName?: string;
};

function resolveSystemName(
  relation: UserAppRelation,
  appClients: AppClient[],
): string {
  if (relation.appName) return relation.appName;
  const app = appClients.find((item) => item.id === relation.appId);
  return app?.name ?? `#${relation.appId}`;
}

function toAssignedSystems(
  relations: UserAppRelation[],
  appClients: AppClient[],
): AssignedSystemItem[] {
  return relations.map((relation) => ({
    appId: relation.appId,
    name: resolveSystemName(relation, appClients),
    roleName: relation.roleName,
  }));
}

export function useUserDetail(userId: number) {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [assignedSystems, setAssignedSystems] = useState<AssignedSystemItem[]>(
    [],
  );

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(userId) || userId <= 0) {
      setUser(null);
      setAssignedSystems([]);
      return;
    }

    setLoading(true);
    try {
      const userDetail = await UserController_findOne(userId);

      const [apps, allRelations] = await Promise.all([
        AppClientController_findAll().catch(() => [] as AppClient[]),
        UserAppController_findAll().catch(() => [] as UserAppRelation[]),
      ]);

      const appClients = Array.isArray(apps) ? apps : [];
      const userRelations = allRelations.filter(
        (item) => item.userId === userId,
      );

      setUser(userDetail);
      setAssignedSystems(toAssignedSystems(userRelations, appClients));
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'user.loadFailed' }),
      );
      setUser(null);
      setAssignedSystems([]);
    } finally {
      setLoading(false);
    }
  }, [intl, userId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const updateStatus = async (nextStatus: UserStatus) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const payload: UpdateUserDto = {
        status: nextStatus,
      };
      await UserController_update(user.id, payload);

      message.success(
        intl.formatMessage({
          id:
            nextStatus === 'ACTIVE'
              ? 'user.detail.enabled'
              : 'user.detail.disabled',
        }),
      );
      await loadDetail();
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'errorFields' in error
      ) {
        return;
      }
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'user.detail.saveFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    user,
    loading,
    submitting,
    assignedSystems,
    updateStatus,
    loadDetail,
  };
}
