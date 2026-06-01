import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import { AgentController_findByAppClient, AgentController_remove } from '@/services/agent';
import type { Agent } from '@/types/agent';
import { history, useIntl } from '@umijs/max';
import { message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AgentListItem } from './agentShared';
import { toAgentListItem } from './agentShared';

export const SEARCH_DEBOUNCE_MS = 300;

export function useAgentList() {
  const intl = useIntl();
  const { projectId } = useProjectRoute();
  const [allAgents, setAllAgents] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim().toLowerCase());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, projectId]);

  const loadAgents = useCallback(async () => {
    if (!projectId) {
      setAllAgents([]);
      return;
    }

    setLoading(true);
    try {
      const result = await AgentController_findByAppClient(projectId);
      setAllAgents(result.list.map((item) => toAgentListItem(item, intl)));
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : intl.formatMessage({ id: 'agent.loadFailed' }),
      );
      setAllAgents([]);
    } finally {
      setLoading(false);
    }
  }, [intl, projectId]);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  const filteredAgents = useMemo(() => {
    if (!debouncedKeyword) {
      return allAgents;
    }

    return allAgents.filter((agent) => {
      const haystack = `${agent.name} ${agent.description ?? ''}`.toLowerCase();
      return haystack.includes(debouncedKeyword);
    });
  }, [allAgents, debouncedKeyword]);

  const total = filteredAgents.length;

  const agents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAgents.slice(start, start + pageSize);
  }, [filteredAgents, page, pageSize]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize) || 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, pageSize, total]);

  const isSearchActive = debouncedKeyword.length > 0;
  const showEmpty = Boolean(projectId) && !loading && allAgents.length === 0;
  const showSearchEmpty = Boolean(projectId) && !loading && allAgents.length > 0 && total === 0;
  const showPagination = Boolean(projectId) && total > 0;

  const summaryText = useMemo(() => {
    if (!projectId || loading) {
      return null;
    }
    if (isSearchActive && total === 0) {
      return intl.formatMessage({ id: 'agent.summary.searchNone' });
    }
    if (isSearchActive) {
      return intl.formatMessage({ id: 'agent.summary.searchFound' }, { total });
    }
    return intl.formatMessage({ id: 'agent.summary.total' }, { total: allAgents.length });
  }, [allAgents.length, intl, isSearchActive, loading, projectId, total]);

  const toDetailPath = (agentId: number) => `/agent/detail/${agentId}`;

  const openDetail = (agent: Agent | AgentListItem) => {
    history.push(toDetailPath(agent.id));
  };

  const openCreate = () => {
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'agent.selectProject' }));
      return;
    }
    history.push('/agent/detail/create');
  };

  const onPageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  };

  const handleDelete = async (id: number) => {
    try {
      await AgentController_remove(id);
      message.success(intl.formatMessage({ id: 'agent.deleted' }));
      if (agents.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      }
      await loadAgents();
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : intl.formatMessage({ id: 'agent.deleteFailed' }),
      );
    }
  };

  return {
    projectId,
    agents,
    loading,
    keyword,
    page,
    pageSize,
    total,
    isSearchActive,
    summaryText,
    showEmpty,
    showSearchEmpty,
    showPagination,
    setKeyword,
    onPageChange,
    openDetail,
    openCreate,
    handleDelete,
    loadAgents,
  };
}
