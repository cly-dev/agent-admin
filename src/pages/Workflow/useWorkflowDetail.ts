import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  HOST_TOOL_MAX_PAGE_SIZE,
  HostToolController_findByAppClient,
} from '@/services/host-tool';
import { ToolController_findByAppClient } from '@/services/tool';
import {
  WorkflowController_create,
  WorkflowController_findOne,
  WorkflowController_listPresetsCatalog,
  WorkflowController_listRevisions,
  WorkflowController_update,
} from '@/services/workflow';
import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import type {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  Workflow,
  WorkflowDeliverable,
  WorkflowNodeDef,
  WorkflowPresetCatalogEntry,
  WorkflowProfile,
  WorkflowRevision,
} from '@/types/workflow';
import { history, useIntl, useLocation, useParams } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { WORKFLOW_LIST_PATH } from './useWorkflowList';
import { formatWorkflowSaveError } from './workflowApiError';
import {
  buildPresetConfigPayload,
  defaultPresetForProfile,
  emptyPresetConfig,
  inferDeliverableForPreset,
  validatePresetForm,
  type WorkflowConfigMode,
  type WorkflowPresetFormState,
} from './workflowPreset';
import {
  buildOptionalBindingsPayload,
  createEmptyWorkflowNode,
  syncBindingRowsFromNodes,
  validateWorkflowNodes,
  type WorkflowHostToolRow,
  type WorkflowToolRow,
} from './workflowShared';

export type { WorkflowHostToolRow, WorkflowToolRow };

export type WorkflowFormValues = {
  workflowKey: string;
  name: string;
  description?: string;
  goal?: string;
  profile: WorkflowProfile;
  deliverable: WorkflowDeliverable;
  isActive: boolean;
  sortOrder: number;
  changeNote?: string;
};

function trimFormString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function hydrateWorkflowAfterSave(
  updated: Workflow,
  fallbackNodes: WorkflowNodeDef[],
): Promise<Workflow> {
  if (updated.nodes.length > 0) {
    return updated;
  }
  try {
    const detail = await WorkflowController_findOne(updated.id);
    return detail.nodes.length > 0
      ? detail
      : { ...detail, nodes: fallbackNodes };
  } catch {
    return { ...updated, nodes: fallbackNodes };
  }
}

export function useWorkflowDetail() {
  const intl = useIntl();
  const location = useLocation();
  const { projectId, currentProject } = useProjectRoute();
  const params = useParams<{ id?: string }>();

  const isCreateMode = location.pathname.endsWith(
    '/workflow/assets/detail/create',
  );
  const workflowId = Number(params.id);
  const isEditMode =
    !isCreateMode && Number.isFinite(workflowId) && workflowId > 0;

  const [form] = Form.useForm<WorkflowFormValues>();
  const profile = Form.useWatch('profile', form) as WorkflowProfile | undefined;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configMode, setConfigMode] = useState<WorkflowConfigMode>('preset');
  const [presetForm, setPresetForm] = useState<WorkflowPresetFormState>({
    preset: null,
    config: emptyPresetConfig(),
  });
  const [presetCatalog, setPresetCatalog] = useState<
    WorkflowPresetCatalogEntry[]
  >([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [nodes, setNodes] = useState<WorkflowNodeDef[]>([]);
  const [toolRows, setToolRows] = useState<WorkflowToolRow[]>([]);
  const [hostToolRows, setHostToolRows] = useState<WorkflowHostToolRow[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [hostTools, setHostTools] = useState<HostTool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [revisions, setRevisions] = useState<WorkflowRevision[]>([]);

  const loadToolOptions = useCallback(async () => {
    if (!projectId) {
      setTools([]);
      setHostTools([]);
      return;
    }
    setToolsLoading(true);
    try {
      const [toolResult, hostToolResult] = await Promise.all([
        ToolController_findByAppClient(projectId, { page: 1, pageSize: 100 }),
        HostToolController_findByAppClient(projectId, {
          page: 1,
          pageSize: HOST_TOOL_MAX_PAGE_SIZE,
          isActive: true,
        }),
      ]);
      setTools(toolResult.list);
      setHostTools(hostToolResult.list);
    } catch {
      setTools([]);
      setHostTools([]);
    } finally {
      setToolsLoading(false);
    }
  }, [projectId]);

  const loadPresetCatalog = useCallback(
    async (nextProfile: WorkflowProfile) => {
      setCatalogLoading(true);
      try {
        const catalog =
          await WorkflowController_listPresetsCatalog(nextProfile);
        setPresetCatalog(catalog);
        return catalog;
      } catch {
        setPresetCatalog([]);
        return [];
      } finally {
        setCatalogLoading(false);
      }
    },
    [],
  );

  const applyDefaultPreset = useCallback(
    (nextProfile: WorkflowProfile, catalog: WorkflowPresetCatalogEntry[]) => {
      const nextPreset = defaultPresetForProfile(nextProfile, catalog);
      setPresetForm({
        preset: nextPreset,
        config: emptyPresetConfig(),
      });
      const deliverable = inferDeliverableForPreset(nextPreset);
      if (deliverable) {
        form.setFieldValue('deliverable', deliverable);
      }
    },
    [form],
  );

  const loadWorkflow = useCallback(async () => {
    if (!isEditMode) {
      return;
    }
    setLoading(true);
    try {
      const detail = await WorkflowController_findOne(workflowId);
      setWorkflow(detail);
      setNodes(detail.nodes);
      setConfigMode('nodes');
      const synced = syncBindingRowsFromNodes(
        detail.nodes,
        detail.workflowTools.map((item) => ({
          toolId: item.toolId,
          isRequired: item.isRequired,
          name: item.tool?.name,
        })),
        detail.workflowHostTools.map((item) => ({
          hostToolId: item.hostToolId,
          isRequired: item.isRequired,
          name: item.hostTool?.name,
        })),
      );
      setToolRows(synced.toolRows);
      setHostToolRows(synced.hostToolRows);
      form.setFieldsValue({
        workflowKey: detail.workflowKey,
        name: detail.name,
        description: detail.description ?? '',
        goal: detail.goal ?? '',
        profile: detail.profile as WorkflowProfile,
        deliverable: detail.deliverable as WorkflowDeliverable,
        isActive: detail.isActive,
        sortOrder: detail.sortOrder,
      });
      const revisionList = await WorkflowController_listRevisions(workflowId);
      setRevisions(revisionList);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'workflow.loadFailed' }),
      );
      setWorkflow(null);
    } finally {
      setLoading(false);
    }
  }, [form, intl, isEditMode, workflowId]);

  const initCreate = useCallback(async () => {
    if (!isCreateMode) {
      return;
    }
    setWorkflow(null);
    setConfigMode('preset');
    setNodes([]);
    setToolRows([]);
    setHostToolRows([]);
    setRevisions([]);
    form.resetFields();
    form.setFieldsValue({
      profile: 'page_action',
      deliverable: 'answer',
      isActive: true,
      sortOrder: 0,
    });
    await loadToolOptions();
    const catalog = await loadPresetCatalog('page_action');
    applyDefaultPreset('page_action', catalog);
  }, [
    applyDefaultPreset,
    form,
    isCreateMode,
    loadPresetCatalog,
    loadToolOptions,
  ]);

  useEffect(() => {
    if (isCreateMode) {
      void initCreate();
      return;
    }
    if (isEditMode) {
      void loadToolOptions();
      void loadWorkflow();
    }
  }, [initCreate, isCreateMode, isEditMode, loadToolOptions, loadWorkflow]);

  useEffect(() => {
    if (!profile || isEditMode) {
      return;
    }
    void (async () => {
      const catalog = await loadPresetCatalog(profile);
      applyDefaultPreset(profile, catalog);
    })();
  }, [applyDefaultPreset, isEditMode, loadPresetCatalog, profile]);

  useEffect(() => {
    if (!isEditMode || configMode !== 'preset' || !profile) {
      return;
    }
    void loadPresetCatalog(profile);
  }, [configMode, isEditMode, loadPresetCatalog, profile]);

  const handleNodesChange = useCallback(
    (nextNodes: WorkflowNodeDef[]) => {
      setNodes(nextNodes);
      if (isEditMode) {
        setConfigMode('nodes');
      }
      const synced = syncBindingRowsFromNodes(
        nextNodes,
        toolRows,
        hostToolRows,
      );
      setToolRows(
        synced.toolRows.map((row) => ({
          ...row,
          name: tools.find((tool) => tool.id === row.toolId)?.name ?? row.name,
        })),
      );
      setHostToolRows(
        synced.hostToolRows.map((row) => ({
          ...row,
          name:
            hostTools.find((tool) => tool.id === row.hostToolId)?.name ??
            row.name,
        })),
      );
    },
    [hostToolRows, hostTools, isEditMode, toolRows, tools],
  );

  const handlePresetFormChange = useCallback(
    (next: WorkflowPresetFormState) => {
      setPresetForm(next);
      const deliverable = inferDeliverableForPreset(next.preset);
      if (deliverable) {
        form.setFieldValue('deliverable', deliverable);
      }
    },
    [form],
  );

  const handleConfigModeChange = useCallback(
    (mode: WorkflowConfigMode) => {
      setConfigMode(mode);
      if (mode === 'nodes' && nodes.length === 0) {
        setNodes([createEmptyWorkflowNode('load_page_context')]);
      }
    },
    [nodes.length],
  );

  const handleToolRequiredChange = useCallback(
    (toolId: number, isRequired: boolean) => {
      setToolRows((rows) =>
        rows.map((row) =>
          row.toolId === toolId ? { ...row, isRequired } : row,
        ),
      );
    },
    [],
  );

  const handleHostToolRequiredChange = useCallback(
    (hostToolId: number, isRequired: boolean) => {
      setHostToolRows((rows) =>
        rows.map((row) =>
          row.hostToolId === hostToolId ? { ...row, isRequired } : row,
        ),
      );
    },
    [],
  );

  const handleBack = () => {
    history.push(WORKFLOW_LIST_PATH);
  };

  const handleSave = async () => {
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'workflow.selectProject' }));
      return;
    }
    await form.validateFields();
    const values = form.getFieldsValue(true) as WorkflowFormValues;

    setSaving(true);
    try {
      if (configMode === 'preset') {
        const issues = validatePresetForm(
          presetForm.preset,
          presetForm.config,
          presetCatalog,
        );
        if (issues.length > 0) {
          message.error(intl.formatMessage({ id: issues[0].messageId }));
          return;
        }
        const preset = presetForm.preset!;
        const presetConfig = buildPresetConfigPayload(
          presetForm.config,
          preset,
        );

        if (isCreateMode) {
          const payload: CreateWorkflowDto = {
            appClientId: projectId,
            workflowKey: trimFormString(values.workflowKey),
            name: trimFormString(values.name),
            description: values.description?.trim() || null,
            goal: values.goal?.trim() || null,
            profile: values.profile,
            deliverable: values.deliverable,
            preset,
            presetConfig,
            isActive: values.isActive,
            sortOrder: values.sortOrder,
            changeNote: values.changeNote?.trim() || undefined,
          };
          await WorkflowController_create(payload);
          message.success(intl.formatMessage({ id: 'workflow.created' }));
          history.replace(WORKFLOW_LIST_PATH);
          return;
        }

        if (!workflow) {
          return;
        }

        const payload: UpdateWorkflowDto = {
          name: trimFormString(values.name),
          description: values.description?.trim() || null,
          goal: values.goal?.trim() || null,
          deliverable: values.deliverable,
          preset,
          presetConfig,
          isActive: values.isActive,
          sortOrder: values.sortOrder,
          changeNote: values.changeNote?.trim() || undefined,
        };
        const updated = await WorkflowController_update(workflow.id, payload);
        const savedWorkflow = await hydrateWorkflowAfterSave(updated, nodes);
        const savedNodes =
          savedWorkflow.nodes.length > 0 ? savedWorkflow.nodes : nodes;
        setWorkflow({ ...savedWorkflow, nodes: savedNodes });
        setNodes(savedNodes);
        setConfigMode('nodes');
        const synced = syncBindingRowsFromNodes(
          savedNodes,
          savedWorkflow.workflowTools.map((item) => ({
            toolId: item.toolId,
            isRequired: item.isRequired,
            name: item.tool?.name,
          })),
          savedWorkflow.workflowHostTools.map((item) => ({
            hostToolId: item.hostToolId,
            isRequired: item.isRequired,
            name: item.hostTool?.name,
          })),
        );
        setToolRows(synced.toolRows);
        setHostToolRows(synced.hostToolRows);
        const revisionList = await WorkflowController_listRevisions(
          savedWorkflow.id,
        );
        setRevisions(revisionList);
        message.success(intl.formatMessage({ id: 'workflow.updated' }));
        history.replace(WORKFLOW_LIST_PATH);
        return;
      }

      if (nodes.length === 0) {
        message.error(intl.formatMessage({ id: 'workflow.nodes.required' }));
        return;
      }

      const nodeIssues = validateWorkflowNodes(nodes);
      if (nodeIssues.length > 0) {
        const first = nodeIssues[0];
        message.error(
          intl.formatMessage(
            { id: `workflow.validation.${first.code}` },
            { nodeId: first.nodeId },
          ),
        );
        return;
      }

      const optionalBindings = buildOptionalBindingsPayload(
        toolRows,
        hostToolRows,
        nodes,
      );

      if (isCreateMode) {
        const payload: CreateWorkflowDto = {
          appClientId: projectId,
          workflowKey: trimFormString(values.workflowKey),
          name: trimFormString(values.name),
          description: values.description?.trim() || null,
          goal: values.goal?.trim() || null,
          profile: values.profile,
          deliverable: values.deliverable,
          nodes,
          isActive: values.isActive,
          sortOrder: values.sortOrder,
          ...optionalBindings,
          changeNote: values.changeNote?.trim() || undefined,
        };
        await WorkflowController_create(payload);
        message.success(intl.formatMessage({ id: 'workflow.created' }));
        history.replace(WORKFLOW_LIST_PATH);
        return;
      }

      if (!workflow) {
        return;
      }

      const payload: UpdateWorkflowDto = {
        name: trimFormString(values.name),
        description: values.description?.trim() || null,
        goal: values.goal?.trim() || null,
        deliverable: values.deliverable,
        nodes,
        isActive: values.isActive,
        sortOrder: values.sortOrder,
        ...optionalBindings,
        changeNote: values.changeNote?.trim() || undefined,
      };
      const updated = await WorkflowController_update(workflow.id, payload);
      const savedWorkflow = await hydrateWorkflowAfterSave(updated, nodes);
      const savedNodes =
        savedWorkflow.nodes.length > 0 ? savedWorkflow.nodes : nodes;
      setWorkflow({ ...savedWorkflow, nodes: savedNodes });
      setNodes(savedNodes);
      const synced = syncBindingRowsFromNodes(
        savedNodes,
        savedWorkflow.workflowTools.map((item) => ({
          toolId: item.toolId,
          isRequired: item.isRequired,
          name: item.tool?.name,
        })),
        savedWorkflow.workflowHostTools.map((item) => ({
          hostToolId: item.hostToolId,
          isRequired: item.isRequired,
          name: item.hostTool?.name,
        })),
      );
      setToolRows(synced.toolRows);
      setHostToolRows(synced.hostToolRows);
      const revisionList = await WorkflowController_listRevisions(
        savedWorkflow.id,
      );
      setRevisions(revisionList);
      message.success(intl.formatMessage({ id: 'workflow.updated' }));
      history.replace(WORKFLOW_LIST_PATH);
    } catch (error: unknown) {
      message.error(
        formatWorkflowSaveError(intl, error, 'workflow.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    projectId,
    currentProject,
    isCreateMode,
    isEditMode,
    workflow,
    loading,
    saving,
    form,
    profile,
    configMode,
    setConfigMode: handleConfigModeChange,
    presetForm,
    setPresetForm: handlePresetFormChange,
    presetCatalog,
    catalogLoading,
    nodes,
    setNodes: handleNodesChange,
    toolRows,
    hostToolRows,
    tools,
    hostTools,
    toolsLoading,
    revisions,
    handleToolRequiredChange,
    handleHostToolRequiredChange,
    handleBack,
    handleSave,
  };
}
