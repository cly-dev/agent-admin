import type { ProjectAuthConfigFormValues } from '@/pages/Project/appClientAuth';
import { resolveAuthConfigForUpdate } from '@/pages/Project/appClientAuth';
import {
  AppClientController_findOne,
  AppClientController_remove,
  AppClientController_update,
} from '@/services/admin-app-client';
import type { AppClient, UpdateAppClientDto } from '@/types/admin-app-client';
import { history, useIntl, useModel } from '@umijs/max';
import { Form, message, type FormInstance } from 'antd';
import { useCallback, useEffect, useState } from 'react';

export type ProjectDetailFormValues = {
  name: string;
  description?: string;
  isActive: boolean;
};

export function useProjectDetail(projectId: number) {
  const intl = useIntl();
  const { refreshProjects } = useModel('project');
  const [form] = Form.useForm<ProjectDetailFormValues>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [project, setProject] = useState<AppClient | null>(null);

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      setProject(null);
      return;
    }

    setLoading(true);
    try {
      const detail = await AppClientController_findOne(projectId);
      setProject(detail);
      form.setFieldsValue({
        name: detail.name,
        description: detail.description ?? '',
        isActive: detail.isActive,
      });
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'project.loadFailed' }),
      );
      setProject(null);
      form.resetFields();
    } finally {
      setLoading(false);
    }
  }, [form, intl, projectId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleSave = async (
    authForm?: FormInstance<ProjectAuthConfigFormValues>,
  ) => {
    if (!project) return;

    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const payload: UpdateAppClientDto = {
        name: values.name.trim(),
        isActive: values.isActive,
        description: values.description?.trim() || undefined,
      };

      if (authForm) {
        const authConfig = await resolveAuthConfigForUpdate(authForm);
        if (authConfig !== undefined) {
          payload.authConfig = authConfig;
        }
      }

      await AppClientController_update(projectId, payload);
      message.success(intl.formatMessage({ id: 'project.detail.saved' }));
      await refreshProjects();
      history.replace('/project');
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
          : intl.formatMessage({ id: 'project.detail.saveFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!project) return;

    setDeleting(true);
    try {
      await AppClientController_remove(projectId);
      message.success(intl.formatMessage({ id: 'project.deleted' }));
      await refreshProjects();
      history.push('/project');
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'project.deleteFailed' }),
      );
    } finally {
      setDeleting(false);
    }
  };

  return {
    form,
    project,
    loading,
    submitting,
    deleting,
    handleSave,
    handleRemove,
    reload: loadDetail,
  };
}
