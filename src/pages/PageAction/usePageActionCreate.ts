import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  HostToolController_findByAppClient,
  HOST_TOOL_MAX_PAGE_SIZE,
} from '@/services/host-tool';
import { PageActionController_create } from '@/services/page-action';
import type { HostTool } from '@/types/host-tool';
import type { CreatePageActionDto } from '@/types/page-action';
import { formatApiErrorMessage } from '@/utils/api-error';
import { history, useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import type { WorkflowBindingValue } from '@/types/workflow';
import { useCallback, useEffect, useState } from 'react';
import {
  PAGE_ACTION_LIST_PATH,
  buildInlineHostTool,
  buildPageActionFormPatchFromHostTool,
  getDefaultPageActionFormValues,
  validatePageActionWorkflowBinding,
  type PageActionFormValues,
  type PageActionWorkflowPushState,
} from './pageActionFormShared';
import {
  PAGE_ACTION_SYSTEM_PROMPT_MAX,
  inferPageScopeFromActionKey,
} from './pageActionShared';

export function usePageActionCreate() {
  const intl = useIntl();
  const { projectId, currentProject } = useProjectRoute();
  const [form] = Form.useForm<PageActionFormValues>();
  const [hostTools, setHostTools] = useState<HostTool[]>([]);
  const [hostToolsLoading, setHostToolsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workflowBinding, setWorkflowBinding] = useState<WorkflowBindingValue>({
    workflowId: null,
    workflowVersion: null,
    workflowOverrides: null,
  });
  const [workflowPushState, setWorkflowPushState] =
    useState<PageActionWorkflowPushState>({
      hasPushNode: false,
      pushHostToolId: null,
    });

  const loadHostTools = useCallback(async () => {
    if (!projectId) {
      setHostTools([]);
      return;
    }
    setHostToolsLoading(true);
    try {
      const result = await HostToolController_findByAppClient(projectId, {
        page: 1,
        pageSize: HOST_TOOL_MAX_PAGE_SIZE,
        isActive: true,
      });
      setHostTools(result.list);
    } catch {
      setHostTools([]);
    } finally {
      setHostToolsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(getDefaultPageActionFormValues());
    setWorkflowBinding({
      workflowId: null,
      workflowVersion: null,
      workflowOverrides: null,
    });
    setWorkflowPushState({ hasPushNode: false, pushHostToolId: null });
    void loadHostTools();
  }, [form, loadHostTools, projectId]);

  const handleBack = () => {
    history.push(PAGE_ACTION_LIST_PATH);
  };

  const handleActionKeyBlur = () => {
    const actionKey = form.getFieldValue('actionKey');
    if (typeof actionKey !== 'string') {
      return;
    }
    const currentScope = form.getFieldValue('pageScope');
    if (currentScope?.trim()) {
      return;
    }
    const inferred = inferPageScopeFromActionKey(actionKey);
    if (inferred) {
      form.setFieldValue('pageScope', inferred);
    }
  };

  const handleHostToolChange = (hostToolId?: number) => {
    if (!hostToolId) {
      return;
    }
    const tool = hostTools.find((item) => item.id === hostToolId);
    if (!tool) {
      return;
    }
    const current = form.getFieldsValue();
    form.setFieldsValue(
      buildPageActionFormPatchFromHostTool(tool, current, {
        preserveUserInput: false,
      }),
    );
  };

  const handlePushHostToolResolved = useCallback(
    (hostToolId: number | null, hasPushNode: boolean) => {
      setWorkflowPushState({ hasPushNode, pushHostToolId: hostToolId });
      if (!hasPushNode || !hostToolId) {
        return;
      }
      form.setFieldValue('hostToolId', hostToolId);
      const tool = hostTools.find((item) => item.id === hostToolId);
      if (!tool) {
        return;
      }
      const current = form.getFieldsValue();
      form.setFieldsValue(
        buildPageActionFormPatchFromHostTool(tool, current, {
          preserveUserInput: true,
        }),
      );
    },
    [form, hostTools],
  );

  const handleSubmit = async (values: PageActionFormValues) => {
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'pageAction.selectProject' }));
      return;
    }

    const systemPrompt = values.systemPrompt.trim();
    if (systemPrompt.length > PAGE_ACTION_SYSTEM_PROMPT_MAX) {
      message.error(
        intl.formatMessage(
          { id: 'pageAction.form.systemPromptTooLong' },
          { max: PAGE_ACTION_SYSTEM_PROMPT_MAX },
        ),
      );
      return;
    }

    const actionKey = values.actionKey.trim();

    const workflowError = validatePageActionWorkflowBinding(
      workflowBinding.workflowId,
      workflowPushState,
      values.hostToolId,
      {
        missingPushNode: intl.formatMessage({
          id: 'workflow.binding.missingPushNode',
        }),
        hostToolRequired: intl.formatMessage({
          id: 'pageAction.form.workflowHostToolRequired',
        }),
        hostToolMismatch: intl.formatMessage({
          id: 'pageAction.form.workflowHostToolMismatch',
        }),
      },
    );
    if (workflowError) {
      message.error(workflowError);
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreatePageActionDto = {
        appClientId: projectId,
        actionKey,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        pageScope: values.pageScope?.trim() || null,
        systemPrompt,
        allowCustomInstruction: values.allowCustomInstruction,
        isActive: values.isActive,
        sortOrder: values.sortOrder,
        workflowId: workflowBinding.workflowId,
        workflowVersion: workflowBinding.workflowVersion,
        workflowOverrides: workflowBinding.workflowOverrides,
      };

      if (values.hostToolId) {
        const boundTool = hostTools.find((tool) => tool.id === values.hostToolId);
        if (!boundTool) {
          message.error(
            intl.formatMessage({ id: 'pageAction.form.hostToolRequired' }),
          );
          return;
        }
        payload.hostToolId = values.hostToolId;
      } else {
        const hostTool = buildInlineHostTool(values);
        if (hostTool) {
          payload.hostTool = hostTool;
        }
      }

      await PageActionController_create(payload);
      message.success(intl.formatMessage({ id: 'pageAction.created' }));
      history.push(PAGE_ACTION_LIST_PATH);
    } catch (error: unknown) {
      message.error(
        formatApiErrorMessage(
          error,
          intl.formatMessage({ id: 'pageAction.actionFailed' }),
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    projectId,
    currentProject,
    form,
    hostTools,
    hostToolsLoading,
    submitting,
    workflowBinding,
    setWorkflowBinding,
    workflowPushState,
    hostToolIdLocked:
      Boolean(workflowBinding.workflowId) && workflowPushState.hasPushNode,
    handlePushHostToolResolved,
    handleBack,
    handleActionKeyBlur,
    handleHostToolChange,
    handleSubmit,
  };
}
