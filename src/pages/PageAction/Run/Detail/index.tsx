import { AppDetailPage } from '@/components/AppDetailHeader';
import { ChatJsonViewer } from '@/pages/Chat/components/ChatJsonViewer';
import ContentEmpty from '@/components/ContentEmpty';
import type { PageActionRunStatus } from '@/types/page-action-run';
import { history, Link, useIntl, useParams } from '@umijs/max';
import { Alert, Tag } from 'antd';
import PageActionRunStepsTimeline from '../components/PageActionRunStepsTimeline';
import styles from '../index.module.scss';
import {
  PAGE_ACTION_RUN_STATUS_COLORS,
  formatDurationMs,
  formatDwellDuration,
  formatPageActionRunDateTime,
  formatPageActionRunFinishedAt,
  formatUserLabel,
  isWorkflowTriggerPermissionDenied,
  resolvePageActionRunStatusAlert,
} from '../pageActionRunDisplay';
import { usePageActionRunDetail } from '../usePageActionRunDetail';

const PageActionRunDetailPage: React.FC = () => {
  const intl = useIntl();
  const { id } = useParams<{ id: string }>();
  const { projectId, loading, run, isValidRunId, listPath } =
    usePageActionRunDetail(id);

  const handleBack = () => {
    history.push(listPath);
  };

  const pageTitle = run
    ? intl.formatMessage({ id: 'pageActionRun.detail.titleWithId' }, { id: run.id })
    : intl.formatMessage({ id: 'pageActionRun.detail.title' });

  const subtitle = run
    ? intl.formatMessage(
        { id: 'pageActionRun.detail.subtitle' },
        { actionKey: run.actionKey, name: run.pageActionName },
      )
    : undefined;

  let body: React.ReactNode = null;

  if (!projectId) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'pageActionRun.empty.noProject.title' })}
        description={intl.formatMessage({
          id: 'pageActionRun.empty.noProject.desc',
        })}
      />
    );
  } else if (!isValidRunId) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'pageActionRun.detail.invalidId' })}
        description={intl.formatMessage({ id: 'pageActionRun.detail.notFoundDesc' })}
      />
    );
  } else if (!loading && !run) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'pageActionRun.detail.notFound' })}
        description={intl.formatMessage({ id: 'pageActionRun.detail.notFoundDesc' })}
      />
    );
  } else if (run) {
    const status = run.status as PageActionRunStatus;
    const statusColor = PAGE_ACTION_RUN_STATUS_COLORS[status] ?? 'default';
    const statusAlert = resolvePageActionRunStatusAlert(run, intl);

    body = (
      <>
        {statusAlert ? (
          <Alert
            type={statusAlert.type}
            showIcon
            className={styles.runDetailStatusAlert}
            message={statusAlert.message}
            action={
              isWorkflowTriggerPermissionDenied(run) ? (
                <Link to="/user/role">
                  {intl.formatMessage({ id: 'pageActionRun.permissionDenied.link' })}
                </Link>
              ) : undefined
            }
          />
        ) : null}

        <section className={styles.runDetailHero}>
          <p className={styles.runDetailHeroKey}>{run.actionKey}</p>
          <div className={styles.runDetailHeroMeta}>
            <span>{run.pageActionName}</span>
            <Tag color={statusColor}>
              {intl.formatMessage({
                id: `pageActionRun.status.${status}`,
                defaultMessage: run.status,
              })}
            </Tag>
            <span>
              {intl.formatMessage({ id: 'pageActionRun.column.generation' })}: {run.generation}
            </span>
          </div>
        </section>

        <div className={styles.runDetailLayout}>
          <section className={styles.runDetailPanel}>
            <h2 className={styles.runDetailPanelTitle}>
              {intl.formatMessage({ id: 'pageActionRun.detail.stepsTitle' })}
            </h2>
            <PageActionRunStepsTimeline steps={run.steps} />
          </section>

          <aside className="flex flex-col gap-4">
            {run.workflowId || run.workflowRun ? (
              <section className={styles.runDetailPanel}>
                <h2 className={styles.runDetailPanelTitle}>
                  {intl.formatMessage({ id: 'pageActionRun.detail.workflowTitle' })}
                </h2>
                <dl className={styles.runDetailMeta}>
                  <div>
                    <dt>{intl.formatMessage({ id: 'pageActionRun.detail.workflowId' })}</dt>
                    <dd>{run.workflowId ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>{intl.formatMessage({ id: 'pageActionRun.detail.workflowVersion' })}</dt>
                    <dd>{run.workflowVersion ?? '—'}</dd>
                  </div>
                  {run.workflowRun?.currentNodeId ? (
                    <div>
                      <dt>
                        {intl.formatMessage({ id: 'pageActionRun.detail.currentNodeId' })}
                      </dt>
                      <dd>{run.workflowRun.currentNodeId}</dd>
                    </div>
                  ) : null}
                  {run.workflowRun?.compiledFrom ? (
                    <div>
                      <dt>{intl.formatMessage({ id: 'pageActionRun.detail.compiledFrom' })}</dt>
                      <dd>{run.workflowRun.compiledFrom}</dd>
                    </div>
                  ) : null}
                  {run.workflowRun?.status ? (
                    <div>
                      <dt>{intl.formatMessage({ id: 'pageActionRun.detail.workflowStatus' })}</dt>
                      <dd>{run.workflowRun.status}</dd>
                    </div>
                  ) : null}
                </dl>
                {run.workflowRun?.nodes && run.workflowRun.nodes.length > 0 ? (
                  <ul className={styles.runWorkflowNodes}>
                    {run.workflowRun.nodes.map((node) => (
                      <li key={node.nodeId} className={styles.runWorkflowNode}>
                        <span className={styles.runWorkflowNodeId}>{node.nodeId}</span>
                        <span>{node.action}</span>
                        <Tag>{node.status}</Tag>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {run.workflowRun ? (
                  <ChatJsonViewer value={run.workflowRun} collapsed={2} />
                ) : null}
              </section>
            ) : null}

            <section className={styles.runDetailPanel}>
              <h2 className={styles.runDetailPanelTitle}>
                {intl.formatMessage({ id: 'pageActionRun.detail.summaryTitle' })}
              </h2>
              <dl className={styles.runDetailMeta}>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.column.user' })}</dt>
                  <dd>
                    {formatUserLabel(run.username, run.userEmail, run.userId)}
                  </dd>
                </div>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.column.createdAt' })}</dt>
                  <dd>{formatPageActionRunDateTime(run.createdAt)}</dd>
                </div>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.column.finishedAt' })}</dt>
                  <dd>{formatPageActionRunFinishedAt(run.status, run.finishedAt)}</dd>
                </div>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.column.dwellTime' })}</dt>
                  <dd>
                    {formatDwellDuration(run.createdAt, run.finishedAt, run.status)}
                  </dd>
                </div>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.column.durationMs' })}</dt>
                  <dd>{formatDurationMs(run.durationMs)}</dd>
                </div>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.column.dslOutcome' })}</dt>
                  <dd>
                    {run.dslOutcome
                      ? intl.formatMessage({
                          id: `pageActionRun.dslOutcome.${run.dslOutcome}`,
                          defaultMessage: run.dslOutcome,
                        })
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.column.model' })}</dt>
                  <dd>{run.model ?? '—'}</dd>
                </div>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.column.stepCount' })}</dt>
                  <dd>{run.stepCount}</dd>
                </div>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.column.clientActionId' })}</dt>
                  <dd>{run.clientActionId ?? '—'}</dd>
                </div>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.detail.promptTokens' })}</dt>
                  <dd>{run.promptTokens ?? '—'}</dd>
                </div>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.detail.completionTokens' })}</dt>
                  <dd>{run.completionTokens ?? '—'}</dd>
                </div>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.detail.idempotencyKey' })}</dt>
                  <dd>{run.idempotencyKey ?? '—'}</dd>
                </div>
                <div>
                  <dt>{intl.formatMessage({ id: 'pageActionRun.column.pageActionId' })}</dt>
                  <dd>{run.pageActionId}</dd>
                </div>
              </dl>
            </section>

            {run.errorMessage || run.errorCode ? (
              <section className={styles.runDetailPanel}>
                <h2 className={styles.runDetailPanelTitle}>
                  {intl.formatMessage({ id: 'pageActionRun.detail.errorTitle' })}
                </h2>
                <p className={styles.runDetailError}>
                  {[run.errorCode, run.errorMessage].filter(Boolean).join(': ')}
                </p>
              </section>
            ) : null}

            {run.fillText ? (
              <section className={styles.runDetailPanel}>
                <h2 className={styles.runDetailPanelTitle}>
                  {intl.formatMessage({ id: 'pageActionRun.detail.fillTextTitle' })}
                </h2>
                <pre className={styles.runDetailTextBlock}>{run.fillText}</pre>
              </section>
            ) : null}

            {run.instruction ? (
              <section className={styles.runDetailPanel}>
                <h2 className={styles.runDetailPanelTitle}>
                  {intl.formatMessage({ id: 'pageActionRun.detail.instructionTitle' })}
                </h2>
                <pre className={styles.runDetailTextBlock}>{run.instruction}</pre>
              </section>
            ) : null}

            {run.pageContext !== null && run.pageContext !== undefined ? (
              <section className={styles.runDetailPanel}>
                <h2 className={styles.runDetailPanelTitle}>
                  {intl.formatMessage({ id: 'pageActionRun.detail.pageContextTitle' })}
                </h2>
                <ChatJsonViewer value={run.pageContext} collapsed={1} />
              </section>
            ) : null}

            {run.context !== null && run.context !== undefined ? (
              <section className={styles.runDetailPanel}>
                <h2 className={styles.runDetailPanelTitle}>
                  {intl.formatMessage({ id: 'pageActionRun.detail.contextTitle' })}
                </h2>
                <ChatJsonViewer value={run.context} collapsed={1} />
              </section>
            ) : null}
          </aside>
        </div>
      </>
    );
  }

  return (
    <AppDetailPage
      pageClassName={styles.pageActionRunPage}
      loading={loading}
      title={pageTitle}
      subtitle={subtitle}
      onBack={handleBack}
    >
      {body}
    </AppDetailPage>
  );
};

export default PageActionRunDetailPage;
