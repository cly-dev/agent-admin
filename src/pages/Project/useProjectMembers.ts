import { RoleController_findPage } from '@/services/role';
import { UserController_findAll } from '@/services/user';
import {
  UserAppController_addUser,
  UserAppController_findAll,
  UserAppController_remove,
  UserAppController_update,
} from '@/services/user-app';
import type { Role } from '@/types/role';
import type { User } from '@/types/user';
import type { UserAppRelation } from '@/types/user-app';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type AddProjectMemberFormValues = {
  userId: number;
  roleId: number;
};

export type EditProjectMemberRoleFormValues = {
  roleId: number;
};

export function useProjectMembers(projectId: number) {
  const intl = useIntl();
  const [addForm] = Form.useForm<AddProjectMemberFormValues>();
  const [editRoleForm] = Form.useForm<EditProjectMemberRoleFormValues>();
  const [members, setMembers] = useState<UserAppRelation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<UserAppRelation | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [editRoleSubmitting, setEditRoleSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadRoles = useCallback(async () => {
    try {
      const rolePage = await RoleController_findPage({
        page: 1,
        pageSize: 100,
        orderBy: 'name',
        order: 'asc',
      });
      setRoles(rolePage.list);
    } catch {
      setRoles([]);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setMembers([]);
      return;
    }

    setLoading(true);
    try {
      const all = await UserAppController_findAll();
      setMembers(all.filter((item) => item.appId === projectId));
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'project.members.loadFailed' }),
      );
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [intl, projectId]);

  const loadUsers = useCallback(async () => {
    try {
      const userList = await UserController_findAll();
      setUsers(userList);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
    void loadRoles();
  }, [loadMembers, loadRoles]);

  const memberUserIds = useMemo(
    () => new Set(members.map((item) => item.userId)),
    [members],
  );

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: user.username
          ? `${user.username} (${user.email})`
          : user.email || `#${user.id}`,
        disabled: memberUserIds.has(user.id),
      })),
    [memberUserIds, users],
  );

  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role.id, label: role.name })),
    [roles],
  );

  const openAddModal = () => {
    addForm.resetFields();
    void loadUsers();
    void loadRoles();
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    addForm.resetFields();
  };

  const openEditRoleModal = (member: UserAppRelation) => {
    setEditingMember(member);
    editRoleForm.setFieldsValue({
      roleId: member.roleId || undefined,
    });
    void loadRoles();
    setEditRoleModalOpen(true);
  };

  const closeEditRoleModal = () => {
    setEditRoleModalOpen(false);
    setEditingMember(null);
    editRoleForm.resetFields();
  };

  const handleAddMember = async () => {
    const values = await addForm.validateFields();

    if (memberUserIds.has(values.userId)) {
      message.warning(
        intl.formatMessage({ id: 'project.members.alreadyAdded' }),
      );
      return;
    }

    setSubmitting(true);
    try {
      await UserAppController_addUser(projectId, {
        userId: values.userId,
        roleId: values.roleId,
      });
      message.success(intl.formatMessage({ id: 'project.members.added' }));
      closeAddModal();
      await loadMembers();
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
          : intl.formatMessage({ id: 'project.members.addFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMemberRole = async () => {
    if (!editingMember) return;

    const values = await editRoleForm.validateFields();
    if (editingMember.roleId === values.roleId) {
      closeEditRoleModal();
      return;
    }

    setEditRoleSubmitting(true);
    try {
      await UserAppController_update(editingMember.id, {
        roleId: values.roleId,
      });
      message.success(
        intl.formatMessage({ id: 'project.members.roleUpdated' }),
      );
      closeEditRoleModal();
      await loadMembers();
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
          : intl.formatMessage({ id: 'project.members.roleUpdateFailed' }),
      );
    } finally {
      setEditRoleSubmitting(false);
    }
  };

  const handleRemoveMember = async (relationId: number) => {
    setRemovingId(relationId);
    try {
      await UserAppController_remove(relationId);
      message.success(intl.formatMessage({ id: 'project.members.removed' }));
      await loadMembers();
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'project.members.removeFailed' }),
      );
    } finally {
      setRemovingId(null);
    }
  };

  return {
    addForm,
    editRoleForm,
    members,
    loading,
    addModalOpen,
    editRoleModalOpen,
    editingMember,
    submitting,
    editRoleSubmitting,
    removingId,
    userOptions,
    roleOptions,
    openAddModal,
    closeAddModal,
    openEditRoleModal,
    closeEditRoleModal,
    handleAddMember,
    handleUpdateMemberRole,
    handleRemoveMember,
    reloadMembers: loadMembers,
  };
}
