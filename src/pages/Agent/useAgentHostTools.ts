import { SEARCH_DEBOUNCE_MS } from '@/pages/Tool/toolConstants';
import {
  HostToolController_addAgentHostTools,
  HostToolController_getAgentHostTools,
  HostToolController_getAllAgentHostTools,
  HostToolController_removeAgentHostTools,
} from '@/services/host-tool';
import type { HostTool, HostToolSummary } from '@/types/host-tool';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

const BIND_MODAL_PAGE_SIZE = 12;

type UseAgentHostToolsOptions = {
  agentId: number;
  projectId: number;
  enabled: boolean;
  seedHostTools?: HostToolSummary[];
};

function summaryToHostTool(summary: HostToolSummary): HostTool {
  return {
    id: summary.id,
    appClientId: 0,
    definitionKey: summary.definitionKey ?? summary.name,
    name: summary.name,
    description: summary.description ?? '',
    argsSchema: summary.argsSchema ?? {},
    exposure: summary.exposure,
    pageScope: summary.pageScope,
    isActive: summary.isActive,
  };
}

export function useAgentHostTools({
  agentId,
  projectId,
  enabled,
  seedHostTools,
}: UseAgentHostToolsOptions) {
  const intl = useIntl();
  const [boundTools, setBoundTools] = useState<HostTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [bindModalOpen, setBindModalOpen] = useState(false);
  const [bindModalLoading, setBindModalLoading] = useState(false);
  const [bindSubmitting, setBindSubmitting] = useState(false);
  const [unbindSubmittingId, setUnbindSubmittingId] = useState<number | null>(
    null,
  );
  const [availableTools, setAvailableTools] = useState<HostTool[]>([]);
  const [bindModalPage, setBindModalPage] = useState(1);
  const [bindModalPageSize, setBindModalPageSize] =
    useState(BIND_MODAL_PAGE_SIZE);
  const [bindModalTotal, setBindModalTotal] = useState(0);
  const [bindModalKeyword, setBindModalKeyword] = useState('');
  const [bindModalDebouncedKeyword, setBindModalDebouncedKeyword] =
    useState('');

  const boundHostToolIds = boundTools
    .map((tool) => tool.id)
    .filter((id) => id > 0);

  const applyBoundTools = useCallback((tools: HostTool[]) => {
    setBoundTools(tools);
    setTotal(tools.length);
  }, []);

  const loadBoundTools = useCallback(async () => {
    if (!enabled || !agentId || !projectId) {
      applyBoundTools([]);
      return;
    }
    setLoading(true);
    try {
      const tools = await HostToolController_getAllAgentHostTools(
        agentId,
        projectId,
      );
      applyBoundTools(tools.filter((item) => item.bound));
    } catch {
      applyBoundTools([]);
    } finally {
      setLoading(false);
    }
  }, [agentId, applyBoundTools, enabled, projectId]);

  useEffect(() => {
    if (seedHostTools && seedHostTools.length > 0) {
      applyBoundTools(seedHostTools.map(summaryToHostTool));
      return;
    }
    void loadBoundTools();
  }, [applyBoundTools, loadBoundTools, seedHostTools]);

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
    if (!projectId || !agentId) {
      setAvailableTools([]);
      setBindModalTotal(0);
      return;
    }
    setBindModalLoading(true);
    try {
      const result = await HostToolController_getAgentHostTools(
        agentId,
        projectId,
        {
          page: bindModalPage,
          pageSize: bindModalPageSize,
          keyword: bindModalDebouncedKeyword || undefined,
        },
      );
      setAvailableTools(result.list);
      setBindModalTotal(result.total);
    } catch {
      setAvailableTools([]);
      setBindModalTotal(0);
    } finally {
      setBindModalLoading(false);
    }
  }, [
    agentId,
    bindModalDebouncedKeyword,
    bindModalPage,
    bindModalPageSize,
    projectId,
  ]);

  useEffect(() => {
    if (!bindModalOpen || !projectId || !agentId) {
      return;
    }
    void loadAvailableTools();
  }, [agentId, bindModalOpen, loadAvailableTools, projectId]);

  const openBindModal = () => {
    if (!enabled || !agentId || !projectId) {
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
    }
  };

  const onBindModalPageChange = (nextPage: number, nextPageSize: number) => {
    setBindModalPage(nextPage);
    setBindModalPageSize(nextPageSize);
  };

  const handleBindTools = async (hostToolIds: number[]) => {
    if (!agentId || !projectId || hostToolIds.length === 0) {
      return;
    }
    setBindSubmitting(true);
    try {
      const result = await HostToolController_addAgentHostTools(
        agentId,
        projectId,
        { hostToolIds },
      );
      applyBoundTools(result.hostTools);
      message.success(
        intl.formatMessage({ id: 'agent.hostTools.bindSuccess' }),
      );
      setBindModalOpen(false);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'agent.hostTools.bindFailed' }),
      );
    } finally {
      setBindSubmitting(false);
    }
  };

  const handleUnbindTool = async (hostToolId: number) => {
    if (!agentId || !projectId) {
      return;
    }
    setUnbindSubmittingId(hostToolId);
    try {
      const result = await HostToolController_removeAgentHostTools(
        agentId,
        projectId,
        {
          hostToolIds: [hostToolId],
        },
      );
      applyBoundTools(result.hostTools);
      message.success(
        intl.formatMessage({ id: 'agent.hostTools.unbindSuccess' }),
      );
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'agent.hostTools.unbindFailed' }),
      );
    } finally {
      setUnbindSubmittingId(null);
    }
  };

  return {
    boundTools,
    boundHostToolIds,
    loading,
    page: 1,
    pageSize: boundTools.length || 20,
    total,
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
    reload: () => void loadBoundTools(),
  };
}
