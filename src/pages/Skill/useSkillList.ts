import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import { AgentController_findByAppClient } from '@/services/agent';
import {
  SkillController_findByAppClient,
  SkillController_remove,
} from '@/services/skill';
import type { Agent } from '@/types/agent';
import type { Skill } from '@/types/skill';
import { history, useIntl } from '@umijs/max';
import { Form, Modal, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  normalizeSkillFilter,
  type SkillFilterFormValues,
  type SkillFilterValues,
} from './skillFilter';

export function useSkillList() {
  const intl = useIntl();
  const { projectId } = useProjectRoute();
  const [filterForm] = Form.useForm<SkillFilterFormValues>();

  const [appliedFilters, setAppliedFilters] = useState<SkillFilterValues>({});
  const [list, setList] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  const loadAgents = useCallback(async () => {
    if (!projectId) {
      setAgents([]);
      return;
    }
    setAgentsLoading(true);
    try {
      const result = await AgentController_findByAppClient(projectId);
      setAgents(result.list);
    } catch {
      setAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  }, [projectId]);

  const loadList = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      filters: SkillFilterValues,
    ) => {
      if (!projectId) {
        setList([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      try {
        const result = await SkillController_findByAppClient(projectId, {
          page: targetPage,
          pageSize: targetPageSize,
          orderBy: 'updatedAt',
          order: 'desc',
          ...filters,
        });
        setList(result.list);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : intl.formatMessage({ id: 'skill.loadFailed' }),
        );
        setList([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [intl, projectId],
  );

  useEffect(() => {
    if (!projectId) {
      setAgents([]);
      setList([]);
      setTotal(0);
      filterForm.resetFields();
      setAppliedFilters({});
      return;
    }

    void loadAgents();
    filterForm.resetFields();
    setAppliedFilters({});
    setPage(1);
    void loadList(1, DEFAULT_PAGE_SIZE, {});
  }, [filterForm, loadAgents, loadList, projectId]);

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

  const handleFilterSearch = (values: SkillFilterFormValues) => {
    const filters = normalizeSkillFilter(values);
    setAppliedFilters(filters);
    setPage(1);
    void loadList(1, pageSize, filters);
  };

  const handleFilterReset = () => {
    filterForm.resetFields();
    setAppliedFilters({});
    setPage(1);
    void loadList(1, pageSize, {});
  };

  const onPageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
    void loadList(nextPage, nextPageSize, appliedFilters);
  };

  const openCreate = () => {
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'skill.selectProject' }));
      return;
    }
    history.push('/agent/skill/detail/create');
  };

  const skillDetailPath = (skillId: number) =>
    `/agent/skill/detail/${skillId}`;

  const openDetail = (record: Skill) => {
    if (!record.id) {
      return;
    }
    history.push(skillDetailPath(record.id));
  };

  const handleDelete = async (record: Skill) => {
    if (!projectId) {
      return;
    }
    try {
      await SkillController_remove(record.id);
      message.success(intl.formatMessage({ id: 'skill.deleted' }));
      void loadList(page, pageSize, appliedFilters);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'skill.deleteFailed' }),
      );
    }
  };

  const confirmDelete = (record: Skill) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'skill.deleteTitle' }),
      content: intl.formatMessage({ id: 'skill.deleteDesc' }),
      centered: true,
      okButtonProps: { danger: true },
      onOk: async () => {
        await handleDelete(record);
      },
    });
  };

  return {
    projectId,
    filterForm,
    appliedFilters,
    list,
    loading,
    page,
    pageSize,
    total,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    agentOptions,
    agentsLoading,
    openCreate,
    openDetail,
    confirmDelete,
  };
}
