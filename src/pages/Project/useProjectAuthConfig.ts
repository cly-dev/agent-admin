import {
  AppClientController_testAuth,
  AppClientController_update,
} from '@/services/admin-app-client';
import { RoleController_findPage } from '@/services/role';
import type { AppClient } from '@/types/admin-app-client';
import type { AppClientAuthTestResult } from '@/types/app-client-auth';
import type { Role } from '@/types/role';
import {
  requestOmnixChatAutoOpen,
  setOmnixChatAccountToken,
} from '@/utils/omnix-chat';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  authConfigToFormValues,
  resolveAuthConfigForAuthPanelSave,
  type ProjectAuthConfigFormValues,
} from './appClientAuth';

export function useProjectAuthConfig(
  projectId: number,
  project: AppClient | null,
  onSaved?: () => Promise<void> | void,
) {
  const intl = useIntl();
  const [form] = Form.useForm<ProjectAuthConfigFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testToken, setTestToken] = useState('');
  const [testResult, setTestResult] = useState<AppClientAuthTestResult | null>(
    null,
  );
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const useCustomConfig = Form.useWatch('useCustomConfig', form);
  const provider = Form.useWatch('provider', form);
  const watchedAutoBindRoleName = Form.useWatch('autoBindRoleName', form);

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
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
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const authRoleOptions = useMemo(() => {
    const options = roles
      .filter((role) => role.name.trim())
      .map((role) => ({
        value: role.name,
        label: role.description?.trim()
          ? `${role.name} — ${role.description}`
          : role.name,
      }));

    const current =
      typeof watchedAutoBindRoleName === 'string'
        ? watchedAutoBindRoleName.trim()
        : '';
    if (current && !options.some((item) => item.value === current)) {
      options.unshift({ value: current, label: current });
    }

    return options;
  }, [roles, watchedAutoBindRoleName]);

  useEffect(() => {
    if (!project) {
      form.resetFields();
      setTestResult(null);
      return;
    }
    form.setFieldsValue(authConfigToFormValues(project.authConfig));
    setTestResult(null);
  }, [form, project]);

  const resolveFormError = (error: unknown): string => {
    if (error instanceof Error) {
      if (error.message === 'INVALID_EXTRA_HEADERS_JSON') {
        return intl.formatMessage({ id: 'project.auth.extraHeadersInvalid' });
      }
      if (error.message === 'HTTP_PROFILE_REQUIRED') {
        return intl.formatMessage({ id: 'project.auth.httpRequired' });
      }
      if (error.message === 'MAPPING_PATH_INVALID') {
        return intl.formatMessage({ id: 'project.auth.mappingPathInvalid' });
      }
      if (error.message === 'JWT_SHARED_SECRET_REQUIRED') {
        return intl.formatMessage({ id: 'project.auth.jwtSecretRequired' });
      }
      return error.message;
    }
    return intl.formatMessage({ id: 'project.auth.saveFailed' });
  };

  const handleSave = async () => {
    if (!project) {
      return;
    }

    try {
      if (!form.getFieldValue('useCustomConfig')) {
        message.warning(
          intl.formatMessage({ id: 'project.auth.customConfigRequired' }),
        );
        return;
      }

      const authConfig = await resolveAuthConfigForAuthPanelSave(form);
      setSubmitting(true);
      await AppClientController_update(projectId, { authConfig });
      message.success(intl.formatMessage({ id: 'project.auth.saved' }));
      await onSaved?.();
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'errorFields' in error
      ) {
        return;
      }
      message.error(resolveFormError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTest = useCallback(async () => {
    if (!project) {
      return;
    }
    const token = testToken.trim();
    if (!token) {
      message.warning(
        intl.formatMessage({ id: 'project.auth.testTokenRequired' }),
      );
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const result = await AppClientController_testAuth(projectId, {
        accountToken: token,
      });
      setTestResult(result);
      setOmnixChatAccountToken(projectId, token);
      message.success(intl.formatMessage({ id: 'project.auth.testSuccess' }));
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'project.auth.testFailed' }),
      );
    } finally {
      setTesting(false);
    }
  }, [intl, project, projectId, testToken]);

  const handleOpenChatTest = useCallback(() => {
    const token = testToken.trim();
    if (!token) {
      message.warning(
        intl.formatMessage({ id: 'project.auth.testTokenRequired' }),
      );
      return;
    }
    requestOmnixChatAutoOpen(projectId, token);
    message.info(intl.formatMessage({ id: 'project.auth.openChatTestHint' }));
  }, [intl, projectId, testToken]);

  return {
    form,
    submitting,
    testing,
    testToken,
    setTestToken,
    testResult,
    useCustomConfig,
    provider,
    rolesLoading,
    authRoleOptions,
    handleSave,
    handleTest,
    handleOpenChatTest,
  };
}
