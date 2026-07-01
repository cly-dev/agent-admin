import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  HostToolController_findByAppClient,
  HOST_TOOL_MAX_PAGE_SIZE,
} from '@/services/host-tool';
import {
  PageActionController_findOne,
  PageActionController_update,
} from '@/services/page-action';
import type { HostTool } from '@/types/host-tool';
import type { PageAction, UpdatePageActionDto } from '@/types/page-action';
import type { WorkflowBindingValue } from '@/types/workflow';
import { formatApiErrorMessage } from '@/utils/api-error';
import { history, useIntl, useParams } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  PAGE_ACTION_LIST_PATH,
  buildPageActionFormPatchFromHostTool,
  validatePageActionWorkflowBinding,
  type PageActionFormValues,
  type PageActionWorkflowPushState,
} from './pageActionFormShared';
import { PAGE_ACTION_SYSTEM_PROMPT_MAX } from './pageActionShared';

export function usePageActionEdit() {
  const intl = useIntl();
  const { id: idParam } = useParams<{ id: string }>();
  const pageActionId = Number(idParam);
  const isValidId = Number.isFinite(pageActionId) && pageActionId > 0;

  const { projectId, currentProject } = useProjectRoute();
  const [form] = Form.useForm<PageActionFormValues>();
  const [record, setRecord] = useState<PageAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hostTools, setHostTools] = useState<HostTool[]>([]);
  const [hostToolsLoading, setHostToolsLoading] = useState(false);
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

  const loadDetail = useCallback(async () => {
    if (!isValidId) {
      setRecord(null);
      return;
    }
    setLoading(true);
    try {
      const detail = await PageActionController_findOne(pageActionId);
      if (projectId && detail.appClientId && detail.appClientId !== projectId) {
        message.warning(intl.formatMessage({ id: 'pageAction.selectProject' }));
      }
      setRecord(detail);
      form.setFieldsValue({
        actionKey: detail.actionKey,
        name: detail.name,
        description: detail.description ?? undefined,
        hostToolId: detail.hostToolId,
        pageScope: detail.pageScope ?? undefined,
        systemPrompt: detail.systemPrompt,
        allowCustomInstruction: detail.allowCustomInstruction,
        isActive: detail.isActive,
        sortOrder: detail.sortOrder,
      });
      setWorkflowBinding({
        workflowId: detail.workflowId,
        workflowVersion: detail.workflowVersion,
        workflowOverrides: detail.workflowOverrides,
      });
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'pageAction.loadFailed' }),
      );
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [form, intl, isValidId, pageActionId, projectId]);

  useEffect(() => {
    void loadHostTools();
    void loadDetail();
  }, [loadDetail, loadHostTools]);

  const handleBack = () => {
    history.push(PAGE_ACTION_LIST_PATH);
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
        preserveUserInput: true,
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
    if (!projectId || !record) {
      message.warning(intl.formatMessage({ id: 'pageAction.selectProject' }));
      return;
    }

    if (record.appClientId && record.appClientId !== projectId) {
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
      const payload: UpdatePageActionDto = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
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
      }
      const updated = await PageActionController_update(record.id, payload);
      setRecord(updated);
      message.success(intl.formatMessage({ id: 'pageAction.updated' }));
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
    pageActionId,
    isValidId,
    record,
    loading,
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
    handleHostToolChange,
    handleSubmit,
  };
}
