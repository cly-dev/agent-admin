import { useProjectRoute } from '@/hooks/useProjectRoute';
import { PageActionRunController_findDetail } from '@/services/page-action-run';
import type { PageActionRunDetail } from '@/types/page-action-run';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

export function usePageActionRunDetail(runIdParam?: string) {
  const intl = useIntl();
  const { projectId, toPagePath } = useProjectRoute();
  const [loading, setLoading] = useState(false);
  const [run, setRun] = useState<PageActionRunDetail | null>(null);

  const runId = Number(runIdParam);
  const isValidRunId = Number.isFinite(runId) && runId > 0;

  const listPath = toPagePath('workflow', 'page-action-run');

  const loadDetail = useCallback(async () => {
    if (!isValidRunId) {
      setRun(null);
      return;
    }

    setLoading(true);
    try {
      const detail = await PageActionRunController_findDetail(runId);
      setRun(detail);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'pageActionRun.loadFailed' }),
      );
      setRun(null);
    } finally {
      setLoading(false);
    }
  }, [intl, isValidRunId, runId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  return {
    projectId,
    loading,
    run,
    isValidRunId,
    listPath: toPagePath('workflow', 'page-action-run'),
  };
}
