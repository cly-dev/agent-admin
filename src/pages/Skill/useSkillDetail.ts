import { useProjectRoute } from '@/hooks/useProjectRoute';
import { AgentController_findByAppClient } from '@/services/agent';
import {
  HOST_TOOL_MAX_PAGE_SIZE,
  HostToolController_findByAppClient,
  HostToolController_replaceSkillHostTools,
} from '@/services/host-tool';
import {
  SkillController_create,
  SkillController_createByAppClient,
  SkillController_findOne,
  SkillController_replaceTools,
  SkillController_update,
} from '@/services/skill';
import { ToolController_findByAppClient } from '@/services/tool';
import type { Agent, AgentAllowedToolRef } from '@/types/agent';
import type { HostTool, SkillHostToolBindingRecord } from '@/types/host-tool';
import type {
  CreateSkillDto,
  SkillDetail,
  SkillRiskLevel,
  SkillToolBindingItemDto,
  UpdateSkillDto,
} from '@/types/skill';
import type { Tool } from '@/types/tool';
import type { WorkflowBindingValue } from '@/types/workflow';
import { formatApiErrorMessage } from '@/utils/api-error';
import { history, useIntl, useLocation, useParams } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildMutationTabRows,
  buildPlanTabRows,
  buildSkillHostToolsPayload,
  type SkillHostToolTabKey,
  type SkillHostToolTabRow,
} from './skillHostTools';
import {
  promptMarkupToPlainText,
  type SkillPromptHostToolOption,
  type SkillPromptToolOption,
} from './skillPromptMention';
import {
  hasWorkflowConfig,
  parseWorkflowFromConfig,
  type SkillWorkflowState,
} from './skillWorkflow';

function emptyWorkflowBinding(): WorkflowBindingValue {
  return {
    workflowId: null,
    workflowVersion: null,
    workflowOverrides: null,
  };
}

export type SkillExecutionMode = 'prompt' | 'workflow';

export type SkillFormValues = {
  /** 高级：仅本 Bot 可见时可选 */
  agentId?: number;
  name: string;
  prompt: string;
  capabilityKey?: string;
  description?: string;
  riskLevel?: SkillRiskLevel;
  configJson?: string;
  isActive?: boolean;
};

export type SkillToolRow = {
  toolId: number;
  isRequired: boolean;
  name: string;
  description?: string;
  path?: string;
  method?: string;
  bound: boolean;
};

const APP_TOOLS_PAGE_SIZE = 100;

function parseConfigJson(
  value?: string,
): Record<string, unknown> | undefined | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function stringifyConfig(config?: Record<string, unknown>): string {
  if (!config || Object.keys(config).length === 0) {
    return '';
  }
  return JSON.stringify(config, null, 2);
}

function buildConfigForSave(
  configJson: string | undefined,
  useRawConfigOnly: boolean,
): Record<string, unknown> | undefined | null {
  const parsed = parseConfigJson(configJson);
  if (configJson?.trim() && parsed === null) {
    return null;
  }
  if (useRawConfigOnly) {
    return parsed;
  }
  const base = parsed ?? {};
  const rest = { ...base };
  delete rest.workflow;
  delete rest.deliverable;
  return Object.keys(rest).length > 0 ? rest : undefined;
}

function toSkillDtoConfig(
  value: Record<string, unknown> | undefined | null,
): object | undefined {
  return value ?? undefined;
}

function resolveExecutionMode(
  skill?: Pick<SkillDetail, 'workflowId' | 'config'> | null,
  workflow?: SkillWorkflowState,
): SkillExecutionMode {
  if (skill?.workflowId) {
    return 'workflow';
  }
  if (workflow && workflow.steps.length > 0) {
    return 'workflow';
  }
  if (hasWorkflowConfig(skill?.config)) {
    return 'workflow';
  }
  return 'prompt';
}

function toWorkflowBinding(
  skill?: Pick<
    SkillDetail,
    'workflowId' | 'workflowVersion' | 'workflowOverrides'
  > | null,
): WorkflowBindingValue {
  return {
    workflowId: skill?.workflowId ?? null,
    workflowVersion: skill?.workflowVersion ?? null,
    workflowOverrides: skill?.workflowOverrides ?? null,
  };
}

function toolToAllowedRef(tool: Tool): AgentAllowedToolRef {
  return {
    bindingId: tool.id,
    toolId: tool.id,
    name: tool.name,
    description: tool.description,
    path: tool.path,
    method: tool.method,
    isActive: tool.isActive,
  };
}

async function fetchAllActiveAppTools(appClientId: number): Promise<Tool[]> {
  const list: Tool[] = [];
  let page = 1;
  let total = 0;

  do {
    const result = await ToolController_findByAppClient(appClientId, {
      page,
      pageSize: APP_TOOLS_PAGE_SIZE,
      isActive: true,
      orderBy: 'updatedAt',
      order: 'desc',
    });
    list.push(...result.list);
    total = result.total;
    page += 1;
  } while (list.length < total);

  return list;
}

async function fetchAllActiveAppHostTools(
  appClientId: number,
): Promise<HostTool[]> {
  const list: HostTool[] = [];
  let page = 1;
  let total = 0;

  do {
    const result = await HostToolController_findByAppClient(appClientId, {
      page,
      pageSize: HOST_TOOL_MAX_PAGE_SIZE,
      isActive: true,
    });
    list.push(...result.list);
    total = result.total;
    page += 1;
  } while (list.length < total);

  return list;
}

export function useSkillDetail() {
  const intl = useIntl();
  const location = useLocation();
  const { projectId, currentProject } = useProjectRoute();
  const params = useParams<{ skillId?: string }>();

  const isCreateMode = location.pathname.endsWith('/agent/skill/detail/create');
  const skillId = Number(params.skillId);
  const isEditMode = !isCreateMode && Number.isFinite(skillId) && skillId > 0;
  const isValidRoute = isCreateMode ? Boolean(projectId) : isEditMode;

  const [form] = Form.useForm<SkillFormValues>();
  const formAgentId = Form.useWatch('agentId', form);

  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [appToolsLoading, setAppToolsLoading] = useState(false);
  const [toolRows, setToolRows] = useState<SkillToolRow[]>([]);
  const [selectedToolIds, setSelectedToolIds] = useState<number[]>([]);
  const [mutationHostToolRows, setMutationHostToolRows] = useState<
    SkillHostToolTabRow[]
  >([]);
  const [planHostToolRows, setPlanHostToolRows] = useState<
    SkillHostToolTabRow[]
  >([]);
  const [hostToolsDirty, setHostToolsDirty] = useState(false);
  const [hostToolsLoading, setHostToolsLoading] = useState(false);
  const [workflow, setWorkflow] = useState<SkillWorkflowState>({ steps: [] });
  const [workflowBinding, setWorkflowBinding] =
    useState<WorkflowBindingValue>(emptyWorkflowBinding);
  const [hasLegacyWorkflow, setHasLegacyWorkflow] = useState(false);
  const [useRawConfigOnly, setUseRawConfigOnly] = useState(false);
  const [executionMode, setExecutionMode] =
    useState<SkillExecutionMode>('prompt');
  const [useCustomHostToolBinding, setUseCustomHostToolBinding] =
    useState(false);

  const agentOptions = useMemo(
    () =>
      agents.map((agent) => ({
        value: agent.id,
        label: agent.name?.trim()
          ? `${agent.name} (#${agent.id})`
          : `#${agent.id}`,
      })),
    [agents],
  );

  const resolvedAppClientId = skill?.appClientId ?? projectId ?? 0;
  const optionalCreateAgentId =
    Number(formAgentId) > 0 ? Number(formAgentId) : 0;

  const appClientDisplayName = useMemo(() => {
    const fromSkill =
      skill?.appClientName?.trim() || skill?.appClient?.name?.trim();
    if (fromSkill) {
      return fromSkill;
    }
    if (isCreateMode) {
      return currentProject?.name?.trim() || undefined;
    }
    return undefined;
  }, [
    currentProject?.name,
    isCreateMode,
    skill?.appClient?.name,
    skill?.appClientName,
  ]);

  const loadAgents = useCallback(async (appClientId: number) => {
    if (!appClientId) {
      setAgents([]);
      return;
    }
    setAgentsLoading(true);
    try {
      const result = await AgentController_findByAppClient(appClientId);
      setAgents(result.list);
    } catch {
      setAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  const mergeToolRows = useCallback(
    (detail: SkillDetail | null, appTools: AgentAllowedToolRef[]) => {
      const boundMap = new Map(
        (detail?.tools ?? []).map((item) => [item.toolId, item] as const),
      );
      const rows: SkillToolRow[] = appTools
        .filter((tool) => tool.toolId > 0)
        .map((tool) => {
          const binding = boundMap.get(tool.toolId);
          return {
            toolId: tool.toolId,
            isRequired: binding?.isRequired ?? false,
            name: tool.name,
            description: tool.description,
            path: tool.path,
            method: tool.method,
            bound: Boolean(binding),
          };
        });
      setToolRows(rows);
      setSelectedToolIds(
        rows.filter((row) => row.bound).map((row) => row.toolId),
      );
    },
    [],
  );

  const loadHostToolRows = useCallback(
    async (
      appClientId: number,
      skillBindings: SkillHostToolBindingRecord[] = [],
    ) => {
      if (!appClientId) {
        setMutationHostToolRows([]);
        setPlanHostToolRows([]);
        return;
      }
      setHostToolsLoading(true);
      try {
        const appHostTools = await fetchAllActiveAppHostTools(appClientId);
        setMutationHostToolRows(
          buildMutationTabRows(appHostTools, skillBindings),
        );
        setPlanHostToolRows(buildPlanTabRows(appHostTools, skillBindings));
      } catch {
        setMutationHostToolRows([]);
        setPlanHostToolRows([]);
      } finally {
        setHostToolsLoading(false);
      }
    },
    [],
  );

  const syncHostToolState = useCallback(
    (detail: SkillDetail | null, appClientId: number) => {
      const bindings = detail?.skillHostTools ?? [];
      setHostToolsDirty(false);
      void loadHostToolRows(appClientId, bindings);
    },
    [loadHostToolRows],
  );

  const loadAppTools = useCallback(
    async (appClientId: number, detail: SkillDetail | null) => {
      if (!appClientId) {
        setToolRows([]);
        setSelectedToolIds([]);
        return;
      }
      setAppToolsLoading(true);
      try {
        const tools = await fetchAllActiveAppTools(appClientId);
        mergeToolRows(detail, tools.map(toolToAllowedRef));
      } catch {
        setToolRows([]);
        setSelectedToolIds([]);
      } finally {
        setAppToolsLoading(false);
      }
    },
    [mergeToolRows],
  );

  const loadSkill = useCallback(async () => {
    if (!projectId || !isEditMode) {
      return;
    }
    setLoading(true);
    try {
      const detail = await SkillController_findOne(skillId);
      const appClientId = detail.appClientId ?? projectId;
      if (projectId && appClientId && appClientId !== projectId) {
        message.warning(
          intl.formatMessage({ id: 'skill.detail.wrongProject' }),
        );
      }
      setSkill(detail);
      const workflowState = parseWorkflowFromConfig(detail.config);
      setWorkflow(workflowState);
      setWorkflowBinding(toWorkflowBinding(detail));
      setHasLegacyWorkflow(
        !detail.workflowId && hasWorkflowConfig(detail.config),
      );
      setExecutionMode(resolveExecutionMode(detail, workflowState));
      setUseCustomHostToolBinding((detail.skillHostTools ?? []).length > 0);
      setUseRawConfigOnly(
        Boolean(detail.config) && !hasWorkflowConfig(detail.config),
      );
      await loadAgents(appClientId);
      syncHostToolState(detail, appClientId);
      await loadAppTools(appClientId, detail);
      form.setFieldsValue({
        name: detail.name,
        prompt: detail.prompt,
        capabilityKey: detail.capabilityKey ?? '',
        description: detail.description ?? '',
        riskLevel: detail.riskLevel,
        configJson: stringifyConfig(detail.config),
        isActive: detail.isActive ?? true,
      });
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'skill.loadFailed' }),
      );
      setSkill(null);
    } finally {
      setLoading(false);
    }
  }, [
    form,
    intl,
    isEditMode,
    loadAgents,
    loadAppTools,
    syncHostToolState,
    projectId,
    skillId,
  ]);

  const initCreate = useCallback(async () => {
    if (!projectId || !isCreateMode) {
      return;
    }
    setLoading(true);
    try {
      setSkill(null);
      form.resetFields();
      form.setFieldsValue({ isActive: true });
      setToolRows([]);
      setSelectedToolIds([]);
      setMutationHostToolRows([]);
      setPlanHostToolRows([]);
      setHostToolsDirty(false);
      setWorkflow({ steps: [] });
      setWorkflowBinding(emptyWorkflowBinding());
      setHasLegacyWorkflow(false);
      setExecutionMode('prompt');
      setUseCustomHostToolBinding(false);
      setUseRawConfigOnly(false);
      await loadAgents(projectId);
      await loadAppTools(projectId, null);
      syncHostToolState(null, projectId);
    } finally {
      setLoading(false);
    }
  }, [
    form,
    isCreateMode,
    loadAgents,
    loadAppTools,
    projectId,
    syncHostToolState,
  ]);

  useEffect(() => {
    if (isCreateMode) {
      void initCreate();
      return;
    }
    if (isEditMode) {
      void loadSkill();
    }
  }, [initCreate, isCreateMode, isEditMode, loadSkill]);

  const promptToolOptions = useMemo<SkillPromptToolOption[]>(
    () =>
      toolRows.map((row) => ({
        toolId: row.toolId,
        name: row.name,
        description: row.description,
        method: row.method,
        path: row.path,
      })),
    [toolRows],
  );

  const promptHostToolOptions = useMemo<SkillPromptHostToolOption[]>(() => {
    const map = new Map<number, SkillPromptHostToolOption>();
    for (const row of [...mutationHostToolRows, ...planHostToolRows]) {
      if (!map.has(row.hostToolId)) {
        map.set(row.hostToolId, {
          hostToolId: row.hostToolId,
          name: row.name,
          description: row.description,
          pageScope: row.pageScope,
        });
      }
    }
    return Array.from(map.values());
  }, [mutationHostToolRows, planHostToolRows]);

  const selectedHostToolIds = useMemo(() => {
    const ids = new Set<number>();
    for (const row of mutationHostToolRows) {
      if (row.enabled) {
        ids.add(row.hostToolId);
      }
    }
    for (const row of planHostToolRows) {
      if (row.enabled) {
        ids.add(row.hostToolId);
      }
    }
    return Array.from(ids);
  }, [mutationHostToolRows, planHostToolRows]);

  const hostToolNameOptions = useMemo(() => {
    const names = new Set<string>();
    for (const row of [...mutationHostToolRows, ...planHostToolRows]) {
      if (row.name.trim()) {
        names.add(row.name.trim());
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [mutationHostToolRows, planHostToolRows]);

  const handlePromptChange = useCallback(
    (value: string) => {
      form.setFieldValue('prompt', value);
    },
    [form],
  );

  const handleExecutionModeChange = useCallback((mode: SkillExecutionMode) => {
    setExecutionMode(mode);
    if (mode === 'prompt') {
      setWorkflow({ steps: [] });
      setUseRawConfigOnly(false);
      return;
    }
    setUseRawConfigOnly(false);
  }, []);

  const handleToolSelectionChange = useCallback((toolIds: number[]) => {
    setSelectedToolIds(toolIds);
    setToolRows((rows) =>
      rows.map((row) => ({
        ...row,
        bound: toolIds.includes(row.toolId),
        isRequired: toolIds.includes(row.toolId) ? row.isRequired : false,
      })),
    );
  }, []);

  const handleUseCustomHostToolBindingChange = useCallback((value: boolean) => {
    setUseCustomHostToolBinding(value);
    setHostToolsDirty(true);
    if (!value) {
      setMutationHostToolRows((rows) =>
        rows.map((row) => ({ ...row, enabled: false })),
      );
      setPlanHostToolRows((rows) =>
        rows.map((row) => ({ ...row, enabled: false })),
      );
    }
  }, []);

  const handleWorkflowChange = useCallback((next: SkillWorkflowState) => {
    setWorkflow(next);
    setUseRawConfigOnly(false);
  }, []);

  const handleConfigJsonChange = useCallback(
    (value: string) => {
      form.setFieldValue('configJson', value);
      setUseRawConfigOnly(true);
    },
    [form],
  );

  const buildToolsPayload = useCallback((): SkillToolBindingItemDto[] => {
    return selectedToolIds.map((toolId) => ({
      toolId,
      isRequired:
        toolRows.find((row) => row.toolId === toolId)?.isRequired ?? false,
    }));
  }, [selectedToolIds, toolRows]);

  const buildHostToolsPayload = useCallback(() => {
    if (!useCustomHostToolBinding) {
      return null;
    }
    const hasEnabled =
      mutationHostToolRows.some((row) => row.enabled) ||
      planHostToolRows.some((row) => row.enabled);
    if (!hasEnabled) {
      return [];
    }
    return buildSkillHostToolsPayload(mutationHostToolRows, planHostToolRows);
  }, [mutationHostToolRows, planHostToolRows, useCustomHostToolBinding]);

  const handleHostToolTabRowChange = (
    tab: SkillHostToolTabKey,
    hostToolId: number,
    patch: Partial<
      Pick<
        SkillHostToolTabRow,
        'enabled' | 'trigger' | 'priority' | 'isRequired' | 'argsTemplateJson'
      >
    >,
  ) => {
    setHostToolsDirty(true);
    if (patch.enabled) {
      setUseCustomHostToolBinding(true);
    }
    const updater = (rows: SkillHostToolTabRow[]) =>
      rows.map((row) =>
        row.hostToolId === hostToolId ? { ...row, ...patch } : row,
      );
    if (tab === 'mutation') {
      setMutationHostToolRows(updater);
    } else {
      setPlanHostToolRows(updater);
    }
  };

  const handleBack = () => {
    history.push('/agent/skill');
  };

  const handleWorkflowBindingChange = useCallback(
    (next: WorkflowBindingValue) => {
      setWorkflowBinding(next);
    },
    [],
  );

  const handleWorkflowBindingsSynced = useCallback(
    (toolIds: number[], hostToolIds: number[]) => {
      handleToolSelectionChange(toolIds);
      const hostIdSet = new Set(hostToolIds);
      setUseCustomHostToolBinding(true);
      setHostToolsDirty(true);
      setMutationHostToolRows((rows) =>
        rows.map((row) =>
          hostIdSet.has(row.hostToolId)
            ? { ...row, enabled: true, isRequired: true }
            : row,
        ),
      );
      setPlanHostToolRows((rows) =>
        rows.map((row) =>
          hostIdSet.has(row.hostToolId)
            ? { ...row, enabled: true, isRequired: true }
            : row,
        ),
      );
    },
    [handleToolSelectionChange],
  );

  const handleSave = async () => {
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'skill.selectProject' }));
      return;
    }

    const values = await form.validateFields();
    const configParsed = buildConfigForSave(
      values.configJson,
      useRawConfigOnly,
    );
    if (values.configJson?.trim() && configParsed === null) {
      message.error(intl.formatMessage({ id: 'skill.form.configInvalid' }));
      return;
    }

    if (executionMode === 'workflow' && !workflowBinding.workflowId) {
      message.error(
        intl.formatMessage({ id: 'skill.workflow.bindingRequired' }),
      );
      return;
    }

    let hostToolsPayload: ReturnType<typeof buildSkillHostToolsPayload> | null =
      null;
    try {
      if (useCustomHostToolBinding) {
        hostToolsPayload = buildHostToolsPayload();
      } else if (hostToolsDirty) {
        hostToolsPayload = [];
      }
    } catch {
      message.error(
        intl.formatMessage({ id: 'skill.hostTools.argsTemplateInvalid' }),
      );
      return;
    }

    setSaving(true);
    try {
      if (isCreateMode) {
        const toolsPayload = buildToolsPayload();
        const tools: SkillToolBindingItemDto[] | undefined = toolsPayload.length
          ? toolsPayload
          : undefined;

        const payload: CreateSkillDto = {
          name: values.name.trim(),
          prompt: promptMarkupToPlainText(values.prompt).trim(),
          capabilityKey: values.capabilityKey?.trim() || undefined,
          description: values.description?.trim() || undefined,
          config: toSkillDtoConfig(configParsed),
          riskLevel: values.riskLevel,
          isActive: values.isActive ?? true,
          tools,
          ...(executionMode === 'workflow'
            ? {
                workflowId: workflowBinding.workflowId,
                workflowVersion: workflowBinding.workflowVersion,
                workflowOverrides: workflowBinding.workflowOverrides,
              }
            : {
                workflowId: null,
                workflowVersion: null,
                workflowOverrides: null,
              }),
        };

        const created =
          optionalCreateAgentId > 0
            ? await SkillController_create(
                optionalCreateAgentId,
                projectId,
                payload,
              )
            : await SkillController_createByAppClient(projectId, payload);

        if (created.id && hostToolsPayload !== null) {
          await HostToolController_replaceSkillHostTools(created.id, {
            tools: hostToolsPayload,
          });
        }
        message.success(intl.formatMessage({ id: 'skill.created' }));
        history.replace('/agent/skill');
        return;
      }

      if (!skill) {
        return;
      }

      const payload: UpdateSkillDto = {
        name: values.name.trim(),
        prompt: promptMarkupToPlainText(values.prompt).trim(),
        capabilityKey: values.capabilityKey?.trim() ?? '',
        description: values.description?.trim() ?? '',
        config: toSkillDtoConfig(configParsed),
        riskLevel: values.riskLevel,
        isActive: values.isActive,
        ...(executionMode === 'workflow'
          ? {
              workflowId: workflowBinding.workflowId,
              workflowVersion: workflowBinding.workflowVersion,
              workflowOverrides: workflowBinding.workflowOverrides,
            }
          : {
              workflowId: null,
              workflowVersion: null,
              workflowOverrides: null,
            }),
      };

      const updated = await SkillController_update(skill.id, payload);
      const toolsPayload = buildToolsPayload();
      const withTools =
        toolsPayload.length > 0
          ? await SkillController_replaceTools(updated.id, {
              tools: toolsPayload,
            })
          : await SkillController_replaceTools(updated.id, { tools: [] });
      let nextSkill = withTools;
      if (hostToolsPayload !== null || hostToolsDirty) {
        const hostResult = await HostToolController_replaceSkillHostTools(
          withTools.id,
          {
            tools: hostToolsPayload ?? [],
          },
        );
        nextSkill = {
          ...withTools,
          skillHostTools: hostResult.skillHostTools,
          hostTools: hostResult.hostTools,
          hostToolCount: hostResult.skillHostTools.length,
        };
      }
      syncHostToolState(nextSkill, resolvedAppClientId);
      setSkill(nextSkill);
      const nextWorkflow = parseWorkflowFromConfig(nextSkill.config);
      setWorkflow(nextWorkflow);
      setWorkflowBinding(toWorkflowBinding(nextSkill));
      setHasLegacyWorkflow(
        !nextSkill.workflowId && hasWorkflowConfig(nextSkill.config),
      );
      setExecutionMode(resolveExecutionMode(nextSkill, nextWorkflow));
      setUseCustomHostToolBinding((nextSkill.skillHostTools ?? []).length > 0);
      setUseRawConfigOnly(
        Boolean(nextSkill.config) && !hasWorkflowConfig(nextSkill.config),
      );
      form.setFieldsValue({
        capabilityKey: nextSkill.capabilityKey ?? '',
        description: nextSkill.description ?? '',
        riskLevel: nextSkill.riskLevel,
        configJson: stringifyConfig(nextSkill.config),
      });
      message.success(intl.formatMessage({ id: 'skill.updated' }));
      history.replace('/agent/skill');
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'errorFields' in error
      ) {
        return;
      }
      message.error(
        formatApiErrorMessage(
          error,
          intl.formatMessage({ id: 'skill.actionFailed' }),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleToolRequired = (toolId: number, isRequired: boolean) => {
    setSelectedToolIds((ids) =>
      ids.includes(toolId) ? ids : [...ids, toolId],
    );
    setToolRows((rows) =>
      rows.map((row) =>
        row.toolId === toolId ? { ...row, isRequired, bound: true } : row,
      ),
    );
  };

  const showForm = isCreateMode ? Boolean(projectId) : Boolean(skill);

  return {
    projectId,
    skillId,
    isValidRoute,
    isCreateMode,
    isEditMode,
    form,
    skill,
    loading,
    saving,
    appClientDisplayName,
    resolvedAppClientId,
    optionalCreateAgentId,
    agentsLoading,
    agentOptions,
    appToolsLoading,
    hostToolsLoading,
    toolRows,
    mutationHostToolRows,
    planHostToolRows,
    selectedToolIds,
    selectedHostToolIds,
    promptToolOptions,
    promptHostToolOptions,
    workflow,
    workflowBinding,
    hasLegacyWorkflow,
    useRawConfigOnly,
    hostToolNameOptions,
    executionMode,
    useCustomHostToolBinding,
    showForm,
    handleBack,
    handleSave,
    handlePromptChange,
    handleExecutionModeChange,
    handleToolSelectionChange,
    handleUseCustomHostToolBindingChange,
    handleWorkflowChange,
    handleWorkflowBindingChange,
    handleWorkflowBindingsSynced,
    handleConfigJsonChange,
    toggleToolRequired,
    handleHostToolTabRowChange,
  };
}
