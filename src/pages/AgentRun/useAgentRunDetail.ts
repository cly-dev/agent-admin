import { useProjectRoute } from '@/hooks/useProjectRoute';
import { AgentRunController_findOne } from '@/services/agent-run';
import type { AgentRun } from '@/types/agent-run';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useAgentRunDetail(runIdParam?: string) {
  const intl = useIntl();
  const { projectId, toPagePath } = useProjectRoute();
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<AgentRun | null>(null);

  const runId = useMemo(() => Number(runIdParam), [runIdParam]);
  const isValidRunId = Number.isFinite(runId) && runId > 0;
  const listPath = toPagePath('agent', 'run');

  const loadRun = useCallback(async () => {
    if (!projectId || !isValidRunId) {
      setRun(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await AgentRunController_findOne(projectId, runId);
      if (!data.id) {
        setRun(null);
        return;
      }
      setRun(data);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'agentRun.loadFailed' }),
      );
      setRun(null);
    } finally {
      setLoading(false);
    }
  }, [intl, isValidRunId, projectId, runId]);

  useEffect(() => {
    void loadRun();
  }, [loadRun]);

  return {
    projectId,
    loading,
    run,
    isValidRunId,
    listPath,
    reload: loadRun,
  };
}
