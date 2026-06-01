import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  buildAgentGetToolsQuery,
  normalizeAgentBoundToolsFilter,
  type AgentBoundToolsFilterFormValues,
  type AgentBoundToolsFilterValues,
} from './agentBoundToolsFilter';
import { isAgentCreateRoute } from './agentShared';
import { DEFAULT_SYSTEM_PROMPT } from './constants';
import {
  AgentController_addAgentTools,
  AgentController_create,
  AgentController_findOne,
  AgentController_getAgentTools,
  AgentController_removeAgentTools,
  AgentController_update,
} from '@/services/agent';
import { SEARCH_DEBOUNCE_MS } from '@/pages/Tool/toolConstants';
import { ToolController_findPage } from '@/services/tool';
import type { Agent, AgentAllowedToolRef, CreateAgentDto, UpdateAgentDto } from '@/types/agent';
import type { Tool } from '@/types/tool';
import { history, useIntl, useLocation, useParams } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

export type AgentFormValues = {
  name: string;
  description: string;
  systemPrompt: string;
  maxSteps: number;
  enableToolCall: boolean;
};

function agentToFormValues(agent: Agent): AgentFormValues {
  return {
    name: agent.name,
    description: agent.description ?? '',
    systemPrompt: agent.systemPrompt ?? '',
    maxSteps: agent.maxSteps ?? 8,
    enableToolCall: agent.enableToolCall !== false,
  };
}

function formValuesToPayload(values: AgentFormValues): UpdateAgentDto {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    systemPrompt: values.systemPrompt,
    maxSteps: Number(values.maxSteps) || 8,
    enableToolCall: values.enableToolCall,
  };
}

function formValuesToCreatePayload(projectId: number, values: AgentFormValues): CreateAgentDto {
  const payload = formValuesToPayload(values);
  return {
    appClientId: projectId,
    name: payload.name!,
    systemPrompt: payload.systemPrompt!,
    description: payload.description,
    maxSteps: payload.maxSteps,
    enableToolCall: payload.enableToolCall,
  };
}

const DEFAULT_BOUND_TOOLS_PAGE_SIZE = 20;
const BIND_MODAL_PAGE_SIZE = 12;

function toolToAgentRef(tool: Tool): AgentAllowedToolRef {
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

export function useAgentDetail() {
  const intl = useIntl();
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const { projectId } = useProjectRoute();
  const [form] = Form.useForm<AgentFormValues>();
  const [toolsFilterForm] = Form.useForm<AgentBoundToolsFilterFormValues>();
  const [appliedToolsFilters, setAppliedToolsFilters] = useState<AgentBoundToolsFilterValues>({});
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [boundTools, setBoundTools] = useState<AgentAllowedToolRef[]>([]);
  const [createToolIds, setCreateToolIds] = useState<number[]>([]);
  const [toolsPage, setToolsPage] = useState(1);
  const [toolsPageSize, setToolsPageSize] = useState(DEFAULT_BOUND_TOOLS_PAGE_SIZE);
  const [toolsTotal, setToolsTotal] = useState(0);
  const [bindModalOpen, setBindModalOpen] = useState(false);
  const [bindModalLoading, setBindModalLoading] = useState(false);
  const [bindSubmitting, setBindSubmitting] = useState(false);
  const [unbindSubmittingId, setUnbindSubmittingId] = useState<number | null>(null);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [bindModalPage, setBindModalPage] = useState(1);
  const [bindModalPageSize, setBindModalPageSize] = useState(BIND_MODAL_PAGE_SIZE);
  const [bindModalTotal, setBindModalTotal] = useState(0);
  const [bindModalKeyword, setBindModalKeyword] = useState('');
  const [bindModalDebouncedKeyword, setBindModalDebouncedKeyword] = useState('');

  const isCreateMode = isAgentCreateRoute(pathname, id);
  const agentId = isCreateMode ? 0 : Number(id);

  const loadBoundTools = useCallback(
    async (
      targetAgentId: number,
      appClientId: number,
      page: number,
      pageSize: number,
      filters: AgentBoundToolsFilterValues,
    ) => {
      setToolsLoading(true);
      try {
        const result = await AgentController_getAgentTools(
          targetAgentId,
          appClientId,
          buildAgentGetToolsQuery(filters, {
            page,
            pageSize,
            orderBy: 'toolId',
            order: 'asc',
          }),
        );
        setBoundTools(result.list);
        setToolsTotal(result.total);
        setToolsPage(result.page);
        setToolsPageSize(result.pageSize);
      } catch {
        setBoundTools([]);
        setToolsTotal(0);
      } finally {
        setToolsLoading(false);
      }
    },
    [],
  );

  const reloadBoundToolsView = useCallback(
    async (
      targetAgentId: number,
      appClientId: number,
      page: number,
      pageSize: number,
      filters: AgentBoundToolsFilterValues,
    ) => {
      await loadBoundTools(targetAgentId, appClientId, page, pageSize, filters);
    },
    [loadBoundTools],
  );

  const loadAgent = useCallback(async () => {
    if (!projectId) {
      setAgent(null);
      setBoundTools([]);
      setLoading(false);
      return;
    }

    if (isCreateMode) {
      setAgent(null);
      setBoundTools([]);
      setCreateToolIds([]);
      setToolsTotal(0);
      form.setFieldsValue({
        name: '',
        description: '',
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
        maxSteps: 8,
        enableToolCall: true,
      });
      setLoading(false);
      return;
    }

    if (!Number.isFinite(agentId) || agentId <= 0) {
      setAgent(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await AgentController_findOne(agentId);
      if (projectId && data.appClientId !== projectId) {
        message.warning(intl.formatMessage({ id: 'agent.detail.wrongProject' }));
        history.replace('/agent');
        return;
      }
      setAgent(data);
      form.setFieldsValue(agentToFormValues(data));
      toolsFilterForm.resetFields();
      setAppliedToolsFilters({});
      setToolsPage(1);
      await reloadBoundToolsView(data.id, projectId, 1, DEFAULT_BOUND_TOOLS_PAGE_SIZE, {});
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : intl.formatMessage({ id: 'agent.loadFailed' }),
      );
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, [agentId, form, intl, isCreateMode, reloadBoundToolsView, projectId, toolsFilterForm]);

  useEffect(() => {
    void loadAgent();
  }, [loadAgent]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBindModalDebouncedKeyword(bindModalKeyword.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [bindModalKeyword]);

  useEffect(() => {
    setBindModalPage(1);
  }, [bindModalDebouncedKeyword]);

  const loadAvailableTools = useCallback(async () => {
    if (!projectId) {
      setAvailableTools([]);
      setBindModalTotal(0);
      return;
    }

    setBindModalLoading(true);
    try {
      const result = await ToolController_findPage({
        appClientId: projectId,
        page: bindModalPage,
        pageSize: bindModalPageSize,
        keyword: bindModalDebouncedKeyword || undefined,
        orderBy: 'updatedAt',
        order: 'desc',
      });
      setAvailableTools(result.list);
      setBindModalTotal(result.total);
    } catch {
      setAvailableTools([]);
      setBindModalTotal(0);
    } finally {
      setBindModalLoading(false);
    }
  }, [bindModalDebouncedKeyword, bindModalPage, bindModalPageSize, projectId]);

  useEffect(() => {
    if (!bindModalOpen || !projectId) {
      return;
    }
    void loadAvailableTools();
  }, [bindModalOpen, loadAvailableTools, projectId]);

  const openBindModal = () => {
    if (!projectId || (!agent && !isCreateMode)) {
      return;
    }
    setBindModalOpen(true);
  };

  const onBindModalOpenChange = (open: boolean) => {
    setBindModalOpen(open);
    if (!open) {
      setBindModalKeyword('');
      setBindModalDebouncedKeyword('');
      setBindModalPage(1);
      return;
    }
  };

  const onBindModalPageChange = (page: number, pageSize: number) => {
    setBindModalPage(page);
    setBindModalPageSize(pageSize);
  };

  const onBoundToolsPageChange = (page: number, pageSize: number) => {
    if (!agent || !projectId) {
      return;
    }
    setToolsPage(page);
    setToolsPageSize(pageSize);
    void loadBoundTools(agent.id, projectId, page, pageSize, appliedToolsFilters);
  };

  const handleToolsFilterSearch = (values: AgentBoundToolsFilterFormValues) => {
    if (!agent || !projectId) {
      return;
    }
    const filters = normalizeAgentBoundToolsFilter(values);
    setAppliedToolsFilters(filters);
    setToolsPage(1);
    void loadBoundTools(agent.id, projectId, 1, toolsPageSize, filters);
  };

  const handleToolsFilterReset = () => {
    if (!agent || !projectId) {
      return;
    }
    toolsFilterForm.resetFields();
    setAppliedToolsFilters({});
    setToolsPage(1);
    void loadBoundTools(agent.id, projectId, 1, toolsPageSize, {});
  };

  const handleBindTools = async (toolIds: number[]) => {
    if (!projectId || toolIds.length === 0) {
      return;
    }

    if (isCreateMode) {
      setCreateToolIds((prev) => Array.from(new Set([...prev, ...toolIds])));
      setBoundTools((prev) => {
        const nextMap = new Map(prev.map((item) => [item.toolId, item]));
        availableTools
          .filter((tool) => toolIds.includes(tool.id))
          .forEach((tool) => nextMap.set(tool.id, toolToAgentRef(tool)));
        const next = Array.from(nextMap.values());
        setToolsTotal(next.length);
        return next;
      });
      setBindModalOpen(false);
      return;
    }

    if (!agent) {
      return;
    }

    setBindSubmitting(true);
    try {
      await AgentController_addAgentTools(agent.id, projectId, { toolIds });
      message.success(intl.formatMessage({ id: 'agent.tools.bindSuccess' }));
      setBindModalOpen(false);
      await reloadBoundToolsView(agent.id, projectId, toolsPage, toolsPageSize, appliedToolsFilters);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'agent.tools.bindFailed' }),
      );
    } finally {
      setBindSubmitting(false);
    }
  };

  const handleUnbindTool = async (toolId: number) => {
    if (!projectId) {
      return;
    }

    if (isCreateMode) {
      setCreateToolIds((prev) => prev.filter((id) => id !== toolId));
      setBoundTools((prev) => {
        const next = prev.filter((item) => item.toolId !== toolId);
        setToolsTotal(next.length);
        return next;
      });
      return;
    }

    if (!agent) {
      return;
    }

    setUnbindSubmittingId(toolId);
    try {
      await AgentController_removeAgentTools(agent.id, projectId, { toolIds: [toolId] });
      message.success(intl.formatMessage({ id: 'agent.tools.unbindSuccess' }));
      const nextPage =
        boundTools.length <= 1 && toolsPage > 1 ? toolsPage - 1 : toolsPage;
      if (nextPage !== toolsPage) {
        setToolsPage(nextPage);
      }
      await reloadBoundToolsView(
        agent.id,
        projectId,
        nextPage,
        toolsPageSize,
        appliedToolsFilters,
      );
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'agent.tools.unbindFailed' }),
      );
    } finally {
      setUnbindSubmittingId(null);
    }
  };

  const handleDiscard = () => {
    history.push('/agent');
  };

  const handleSubmit = async (values: AgentFormValues) => {
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'agent.selectProject' }));
      return;
    }

    setSubmitting(true);
    try {
      if (isCreateMode) {
        const toolIds = createToolIds.length > 0 ? createToolIds : undefined;
        const created = await AgentController_create({
          ...formValuesToCreatePayload(projectId, values),
          toolIds,
        });
        if (toolIds?.length) {
          try {
            await AgentController_addAgentTools(created.id, projectId, { toolIds });
          } catch {
            // create payload may already bind tools; detail page will show server state
          }
        }
        message.success(intl.formatMessage({ id: 'agent.created' }));
        history.replace(`/agent/detail/${created.id}`);
        return;
      }

      if (!agent) {
        return;
      }

      const updated = await AgentController_update(agent.id, formValuesToPayload(values));
      setAgent(updated);
      form.setFieldsValue(agentToFormValues(updated));
      message.success(intl.formatMessage({ id: 'agent.updated' }));
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : intl.formatMessage({ id: 'agent.actionFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    agent,
    loading,
    submitting,
    toolsFilterForm,
    appliedToolsFilters,
    toolsLoading,
    boundTools,
    toolsPage,
    toolsPageSize,
    toolsTotal,
    // 创建态使用本地已选 toolIds；编辑态使用当前页已绑定 toolIds
    boundToolIds: (isCreateMode ? createToolIds : boundTools.map((t) => t.toolId)).filter(
      (toolId) => toolId > 0,
    ),
    projectId,
    isCreateMode,
    bindModalOpen,
    bindModalLoading,
    bindSubmitting,
    unbindSubmittingId,
    availableTools,
    bindModalPage,
    bindModalPageSize,
    bindModalTotal,
    bindModalKeyword,
    setBindModalKeyword,
    onBindModalPageChange,
    openBindModal,
    onBindModalOpenChange,
    handleBindTools,
    handleUnbindTool,
    onBoundToolsPageChange,
    handleToolsFilterSearch,
    handleToolsFilterReset,
    handleDiscard,
    handleSubmit,
    reload: loadAgent,
  };
}
