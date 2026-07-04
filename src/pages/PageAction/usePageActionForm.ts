import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  HOST_TOOL_MAX_PAGE_SIZE,
  HostToolController_findByAppClient,
} from '@/services/host-tool';
import {
  PageActionController_create,
  PageActionController_findOne,
  PageActionController_update,
} from '@/services/page-action';
import type { HostTool } from '@/types/host-tool';
import type {
  CreatePageActionDto,
  PageAction,
  UpdatePageActionDto,
} from '@/types/page-action';
import type { WorkflowBindingValue } from '@/types/workflow';
import { formatApiErrorMessage } from '@/utils/api-error';
import { history, useIntl, useLocation, useParams } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import {
  PAGE_ACTION_LIST_PATH,
  buildInlineHostTool,
  buildPageActionFormPatchFromHostTool,
  getDefaultPageActionFormValues,
  validatePageActionWorkflowBinding,
  type PageActionConfigMode,
  type PageActionFormValues,
  type PageActionWorkflowPushState,
} from './pageActionFormShared';
import {
  PAGE_ACTION_SYSTEM_PROMPT_MAX,
  inferPageScopeFromActionKey,
} from './pageActionShared';

export function usePageActionForm() {
  const intl = useIntl();
  const location = useLocation();
  const { id: idParam } = useParams<{ id: string }>();
  const isCreateMode = location.pathname.endsWith('/create');
  const pageActionId = Number(idParam);
  const isValidId =
    isCreateMode || (Number.isFinite(pageActionId) && pageActionId > 0);

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
  const [configMode, setConfigMode] = useState<PageActionConfigMode>('prompt');

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

  const initCreate = useCallback(() => {
    form.resetFields();
    form.setFieldsValue(getDefaultPageActionFormValues());
    setRecord(null);
    setLoading(false);
    setWorkflowBinding({
      workflowId: null,
      workflowVersion: null,
      workflowOverrides: null,
    });
    setWorkflowPushState({ hasPushNode: false, pushHostToolId: null });
    setConfigMode('prompt');
  }, [form]);

  const loadDetail = useCallback(async () => {
    if (!isValidId || isCreateMode) {
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
      setConfigMode(detail.workflowId ? 'workflow' : 'prompt');
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
  }, [form, intl, isCreateMode, isValidId, pageActionId, projectId]);

  useEffect(() => {
    void loadHostTools();
    if (isCreateMode) {
      initCreate();
      return;
    }
    void loadDetail();
  }, [initCreate, isCreateMode, loadDetail, loadHostTools, projectId]);

  const handleBack = () => {
    history.push(PAGE_ACTION_LIST_PATH);
  };

  const handleActionKeyBlur = () => {
    if (!isCreateMode) {
      return;
    }
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

  const handleConfigModeChange = (mode: PageActionConfigMode) => {
    setConfigMode(mode);
    if (mode === 'prompt') {
      setWorkflowBinding({
        workflowId: null,
        workflowVersion: null,
        workflowOverrides: null,
      });
      setWorkflowPushState({ hasPushNode: false, pushHostToolId: null });
      return;
    }

    form.setFieldsValue({
      hostToolName: undefined,
      hostToolDescription: undefined,
      hostToolFillField: undefined,
      hostToolId: undefined,
    });
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
        preserveUserInput: !isCreateMode,
      }),
    );
  };

  const handlePushHostToolResolved = useCallback(
    (hostToolId: number | null, hasPushNode: boolean) => {
      setWorkflowPushState({ hasPushNode, pushHostToolId: hostToolId });
    },
    [],
  );

  const handleApplyPushHostTool = useCallback(() => {
    const pushHostToolId = workflowPushState.pushHostToolId;
    if (!pushHostToolId) {
      return;
    }
    form.setFieldValue('hostToolId', pushHostToolId);
    const tool = hostTools.find((item) => item.id === pushHostToolId);
    if (!tool) {
      return;
    }
    const current = form.getFieldsValue();
    form.setFieldsValue(
      buildPageActionFormPatchFromHostTool(tool, current, {
        preserveUserInput: true,
      }),
    );
  }, [form, hostTools, workflowPushState.pushHostToolId]);

  const handleSubmit = async (rawValues: PageActionFormValues) => {
    const values = { ...form.getFieldsValue(), ...rawValues };
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'pageAction.selectProject' }));
      return;
    }

    const systemPrompt = values.systemPrompt.trim();

    if (configMode === 'prompt') {
      if (!systemPrompt) {
        message.error(
          intl.formatMessage({ id: 'pageAction.form.systemPromptRequired' }),
        );
        return;
      }
      if (isCreateMode && !values.hostToolId && !buildInlineHostTool(values)) {
        message.error(
          intl.formatMessage({
            id: 'pageAction.form.promptModeHostToolRequired',
          }),
        );
        return;
      }
    } else if (!workflowBinding.workflowId) {
      message.error(
        intl.formatMessage({ id: 'pageAction.form.workflowModeRequired' }),
      );
      return;
    } else if (!systemPrompt) {
      message.error(
        intl.formatMessage({ id: 'pageAction.form.systemPromptRequired' }),
      );
      return;
    }

    if (systemPrompt.length > PAGE_ACTION_SYSTEM_PROMPT_MAX) {
      message.error(
        intl.formatMessage(
          { id: 'pageAction.form.systemPromptTooLong' },
          { max: PAGE_ACTION_SYSTEM_PROMPT_MAX },
        ),
      );
      return;
    }

    const workflowError =
      configMode === 'workflow'
        ? validatePageActionWorkflowBinding(
            workflowBinding.workflowId,
            workflowPushState.pushHostToolId,
            values.hostToolId,
            {
              hostToolMismatch: intl.formatMessage({
                id: 'pageAction.form.workflowHostToolMismatch',
              }),
            },
          )
        : null;
    if (workflowError) {
      message.error(workflowError);
      return;
    }

    setSubmitting(true);
    try {
      const workflowPayload =
        configMode === 'workflow'
          ? {
              workflowId: workflowBinding.workflowId,
              workflowVersion: workflowBinding.workflowVersion,
              workflowOverrides: workflowBinding.workflowOverrides,
            }
          : {
              workflowId: null,
              workflowVersion: null,
              workflowOverrides: null,
            };

      if (isCreateMode) {
        const actionKey = values.actionKey.trim();
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
          ...workflowPayload,
        };

        if (configMode === 'prompt') {
          if (values.hostToolId) {
            const boundTool = hostTools.find(
              (tool) => tool.id === values.hostToolId,
            );
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
        } else if (values.hostToolId) {
          payload.hostToolId = values.hostToolId;
        }

        await PageActionController_create(payload);
        message.success(intl.formatMessage({ id: 'pageAction.created' }));
        history.push(PAGE_ACTION_LIST_PATH);
        return;
      }

      if (!record) {
        message.warning(intl.formatMessage({ id: 'pageAction.selectProject' }));
        return;
      }

      if (record.appClientId && record.appClientId !== projectId) {
        message.warning(intl.formatMessage({ id: 'pageAction.selectProject' }));
        return;
      }

      const payload: UpdatePageActionDto = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        pageScope: values.pageScope?.trim() || null,
        systemPrompt,
        allowCustomInstruction: values.allowCustomInstruction,
        isActive: values.isActive,
        sortOrder: values.sortOrder,
        ...workflowPayload,
      };
      if (values.hostToolId) {
        const boundTool = hostTools.find(
          (tool) => tool.id === values.hostToolId,
        );
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
    isCreateMode,
    isEditMode: !isCreateMode,
    isValidId,
    record,
    loading,
    form,
    hostTools,
    hostToolsLoading,
    submitting,
    workflowBinding,
    setWorkflowBinding,
    configMode,
    handleConfigModeChange,
    workflowPushState,
    handleApplyPushHostTool,
    handlePushHostToolResolved,
    handleBack,
    handleActionKeyBlur,
    handleHostToolChange,
    handleSubmit,
  };
}
