import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import { AgentController_findByAppClient } from '@/services/agent';
import {
  MessageFeedbackController_findDownReasonTags,
  MessageFeedbackController_findOne,
  MessageFeedbackController_findPage,
  MessageFeedbackController_findSummary,
} from '@/services/message-feedback';
import type { Agent } from '@/types/agent';
import type {
  MessageFeedbackDownReasonTag,
  MessageFeedbackListItem,
  MessageFeedbackSummary,
} from '@/types/message-feedback';
import { useIntl, useSearchParams } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildMessageFeedbackQuery,
  normalizeMessageFeedbackFilter,
  type MessageFeedbackFilterFormValues,
  type MessageFeedbackFilterValues,
} from './messageFeedbackFilter';

const SUMMARY_DAY_OPTIONS = [7, 14, 30] as const;

export function useMessageFeedbackList() {
  const intl = useIntl();
  const { projectId, toPagePath } = useProjectRoute();
  const [searchParams] = useSearchParams();
  const [filterForm] = Form.useForm<MessageFeedbackFilterFormValues>();

  const initialSessionId = searchParams.get('sessionId')?.trim() || undefined;

  const [appliedFilters, setAppliedFilters] =
    useState<MessageFeedbackFilterValues>(() =>
      initialSessionId ? { sessionId: initialSessionId } : {},
    );
  const [list, setList] = useState<MessageFeedbackListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);

  const [summaryDays, setSummaryDays] = useState<number>(7);
  const [summary, setSummary] = useState<MessageFeedbackSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [reasonTags, setReasonTags] = useState<MessageFeedbackDownReasonTag[]>(
    [],
  );
  const [reasonTagsLoading, setReasonTagsLoading] = useState(false);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<MessageFeedbackListItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const reasonTagOptions = useMemo(
    () => reasonTags.map((tag) => ({ value: tag.key, label: tag.label })),
    [reasonTags],
  );

  const loadMeta = useCallback(async () => {
    if (!projectId) {
      setAgents([]);
      setReasonTags([]);
      return;
    }

    setAgentsLoading(true);
    setReasonTagsLoading(true);
    try {
      const [agentResult, tags] = await Promise.all([
        AgentController_findByAppClient(projectId),
        MessageFeedbackController_findDownReasonTags(projectId),
      ]);
      setAgents(agentResult.list);
      setReasonTags(tags);
    } catch {
      setAgents([]);
      setReasonTags([]);
    } finally {
      setAgentsLoading(false);
      setReasonTagsLoading(false);
    }
  }, [projectId]);

  const loadSummary = useCallback(
    async (days: number) => {
      if (!projectId) {
        setSummary(null);
        return;
      }

      setSummaryLoading(true);
      try {
        const result = await MessageFeedbackController_findSummary(
          projectId,
          days,
        );
        setSummary(result);
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : intl.formatMessage({ id: 'messageFeedback.summaryLoadFailed' }),
        );
        setSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    },
    [intl, projectId],
  );

  const loadList = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      filters: MessageFeedbackFilterValues,
    ) => {
      if (!projectId) {
        setList([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      try {
        const result = await MessageFeedbackController_findPage(
          projectId,
          buildMessageFeedbackQuery(filters, {
            page: targetPage,
            pageSize: targetPageSize,
            orderBy: 'createdAt',
            order: 'desc',
          }),
        );
        setList(result.list);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : intl.formatMessage({ id: 'messageFeedback.loadFailed' }),
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
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    void loadSummary(summaryDays);
  }, [loadSummary, summaryDays]);

  useEffect(() => {
    if (!projectId) {
      setList([]);
      setTotal(0);
      setSummary(null);
      filterForm.resetFields();
      setAppliedFilters({});
      return;
    }

    const initialFilters: MessageFeedbackFilterValues = initialSessionId
      ? { sessionId: initialSessionId }
      : {};

    filterForm.setFieldsValue(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
    void loadList(1, DEFAULT_PAGE_SIZE, initialFilters);
  }, [filterForm, initialSessionId, loadList, projectId]);

  const handleFilterSearch = (values: MessageFeedbackFilterFormValues) => {
    const filters = normalizeMessageFeedbackFilter(values);
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

  const openDetail = useCallback(
    async (id: number) => {
      if (!projectId) {
        return;
      }
      setDetailId(id);
      setDetail(null);
      setDetailLoading(true);
      try {
        const result = await MessageFeedbackController_findOne(projectId, id);
        setDetail(result);
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : intl.formatMessage({ id: 'messageFeedback.detailLoadFailed' }),
        );
        setDetailId(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [intl, projectId],
  );

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
  };

  const sessionDetailPath = (sessionId: string) =>
    toPagePath('chat', `detail/${sessionId}`);

  return {
    projectId,
    filterForm,
    appliedFilters,
    list,
    loading,
    page,
    pageSize,
    total,
    summary,
    summaryLoading,
    summaryDays,
    summaryDayOptions: SUMMARY_DAY_OPTIONS,
    setSummaryDays,
    agentsLoading,
    agentOptions,
    reasonTagsLoading,
    reasonTagOptions,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    detailId,
    detail,
    detailLoading,
    openDetail,
    closeDetail,
    sessionDetailPath,
  };
}
