import { AppDetailPage } from '@/components/AppDetailHeader';
import ContentEmpty from '@/components/ContentEmpty';
import type { AgentRunStatus } from '@/types/agent-run';
import { history, useIntl, useParams } from '@umijs/max';
import { Descriptions, Tag } from 'antd';
import { useAgentRunDetail } from '../useAgentRunDetail';
import styles from './index.module.scss';

const statusColor: Record<AgentRunStatus, string> = {
  running: 'processing',
  success: 'success',
  failed: 'error',
};

function renderCodeBlock(value: unknown): React.ReactNode {
  if (value === undefined || value === null || value === '') {
    return <span className="text-on-surface/45">—</span>;
  }

  const text =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return <pre className={styles.agentRunDetailCodeBlock}>{text}</pre>;
}

const AgentRunDetailPage: React.FC = () => {
  const intl = useIntl();
  const { id } = useParams<{ id: string }>();
  const { projectId, loading, run, isValidRunId, listPath } =
    useAgentRunDetail(id);

  const handleBack = () => {
    history.push(listPath);
  };

  const pageTitle = run
    ? intl.formatMessage({ id: 'agentRun.detail.titleWithId' }, { id: run.id })
    : intl.formatMessage({ id: 'agentRun.detail.title' });

  let body: React.ReactNode = null;

  if (!projectId) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'agentRun.empty.noProject.title' })}
        description={intl.formatMessage({
          id: 'agentRun.empty.noProject.desc',
        })}
      />
    );
  } else if (!isValidRunId) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'agentRun.detail.invalidId' })}
        description={intl.formatMessage({ id: 'agentRun.detail.notFoundDesc' })}
      />
    );
  } else if (!loading && !run) {
    body = (
      <ContentEmpty
        className={styles.agentRunDetailEmpty}
        title={intl.formatMessage({ id: 'agentRun.detail.notFound' })}
        description={intl.formatMessage({ id: 'agentRun.detail.notFoundDesc' })}
      />
    );
  } else if (run) {
    body = (
      <>
        <section className={styles.agentRunDetailSection}>
          <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
            <Descriptions.Item label="ID">{run.id}</Descriptions.Item>
            <Descriptions.Item label="AppClient ID">
              {run.appClientId}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.column.agentId' })}
            >
              {run.agentId}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.filter.turnId' })}
            >
              {run.turnId ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.column.sessionId' })}
              span={2}
            >
              {run.sessionId || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.filter.userId' })}
            >
              {run.userId ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.column.role' })}
            >
              {run.role ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.column.status' })}
            >
              {run.status ? (
                <Tag color={statusColor[run.status]}>{run.status}</Tag>
              ) : (
                '—'
              )}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.column.step' })}
            >
              {run.currentStep ?? 0}/{run.maxSteps ?? 0}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.column.durationMs' })}
            >
              {run.durationMs ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.filter.sequence' })}
            >
              {run.sequence ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.filter.parentRunId' })}
            >
              {run.parentRunId ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.filter.finishReason' })}
            >
              {run.finishReason ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.filter.startedAt' })}
            >
              {run.startedAt ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.filter.finishedAt' })}
            >
              {run.finishedAt ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.filter.totalTokens' })}
            >
              {run.totalTokens ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.column.createdAt' })}
            >
              {run.createdAt ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'agentRun.column.updatedAt' })}
            >
              {run.updatedAt ?? '—'}
            </Descriptions.Item>
          </Descriptions>
        </section>

        <section className={styles.agentRunDetailSection}>
          <h3 className={styles.agentRunDetailSectionTitle}>
            {intl.formatMessage({ id: 'agentRun.detail.input' })}
          </h3>
          {renderCodeBlock(run.input)}
        </section>

        <section className={styles.agentRunDetailSection}>
          <h3 className={styles.agentRunDetailSectionTitle}>
            {intl.formatMessage({ id: 'agentRun.detail.output' })}
          </h3>
          {renderCodeBlock(run.output)}
        </section>

        <section className={styles.agentRunDetailSection}>
          <h3 className={styles.agentRunDetailSectionTitle}>
            {intl.formatMessage({ id: 'agentRun.detail.steps' })}
          </h3>
          {renderCodeBlock(run.steps)}
        </section>

        {run.error ? (
          <section className={styles.agentRunDetailSection}>
            <h3 className={styles.agentRunDetailSectionTitle}>
              {intl.formatMessage({ id: 'agentRun.detail.error' })}
            </h3>
            {renderCodeBlock(run.error)}
          </section>
        ) : null}
      </>
    );
  }

  return (
    <AppDetailPage
      pageClassName={styles.agentRunDetailPage}
      loading={loading}
      onBack={handleBack}
      title={pageTitle}
      subtitle={run?.sessionId || undefined}
    >
      {body}
    </AppDetailPage>
  );
};

export default AgentRunDetailPage;
