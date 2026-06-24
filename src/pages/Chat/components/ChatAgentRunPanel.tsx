import type { MessageTurnAgentRun } from '@/types/message-turn';
import { LinkOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Collapse } from 'antd';
import {
  agentRunStatusColor,
  formatDateTime,
  formatMessageContent,
  formatMs,
  isToolsUsedSummary,
  listNonZeroCodeCounts,
  machineCodeLabelKey,
  resolveToolNames,
} from '../chatTurnDisplay';
import styles from '../index.module.scss';
import { ChatAgentRunSteps } from './ChatAgentRunSteps';

type ChatAgentRunPanelProps = {
  run: MessageTurnAgentRun;
  onViewAgentRun: (runId: number) => void;
};

function RunStatusBadge({
  status,
}: {
  status?: MessageTurnAgentRun['status'];
}) {
  if (!status) {
    return null;
  }
  const tone = agentRunStatusColor[status] ?? 'default';
  return (
    <span
      className={`${styles.chatDetailStatusBadge} ${styles[`chatDetailStatus_${tone}`]}`}
    >
      {status}
    </span>
  );
}

export function ChatAgentRunPanel({
  run,
  onViewAgentRun,
}: ChatAgentRunPanelProps) {
  const intl = useIntl();
  const agentName = run.agent?.name ?? `#${run.agentId}`;
  const status = run.status;
  const toolNames = resolveToolNames(run.toolsUsed);
  const runQualityCounts = isToolsUsedSummary(run.toolsUsed)
    ? run.toolsUsed.qualityCounts
    : undefined;
  const runCodeCounts = isToolsUsedSummary(run.toolsUsed)
    ? run.toolsUsed.codeCounts
    : undefined;
  const nonZeroCodes = listNonZeroCodeCounts(runCodeCounts);

  const metrics = [
    {
      key: 'duration',
      label: intl.formatMessage({ id: 'chat.detail.duration' }),
      value: formatMs(run.durationMs),
    },
    {
      key: 'steps',
      label: intl.formatMessage({ id: 'agentRun.column.step' }),
      value: `${run.currentStep ?? 0}/${run.maxSteps ?? 0}`,
    },
    {
      key: 'llm',
      label: intl.formatMessage({ id: 'chat.detail.llmCalls' }),
      value: run.llmCallCount ?? '—',
    },
    {
      key: 'tool',
      label: intl.formatMessage({ id: 'chat.detail.toolCalls' }),
      value: run.toolCallCount ?? '—',
    },
    {
      key: 'model',
      label: intl.formatMessage({ id: 'chat.detail.model' }),
      value: run.model ?? '—',
    },
    {
      key: 'tokens',
      label: intl.formatMessage({ id: 'chat.detail.tokens' }),
      value: `${run.promptTokens ?? '—'} / ${run.completionTokens ?? '—'} / ${run.totalTokens ?? '—'}`,
    },
    {
      key: 'started',
      label: intl.formatMessage({ id: 'chat.detail.startedAt' }),
      value: formatDateTime(run.startedAt),
    },
    {
      key: 'finished',
      label: intl.formatMessage({ id: 'chat.detail.finishedAt' }),
      value: formatDateTime(run.finishedAt),
    },
  ];

  const header = (
    <div className={styles.chatDetailAgentRunHeader}>
      <span className={styles.chatDetailAgentRunTitle}>
        {agentName}
        <span className={styles.chatDetailAgentRunId}>#{run.id}</span>
      </span>
      <span className={styles.chatDetailAgentRunTags}>
        {run.role ? (
          <span className={styles.chatDetailSummaryChip}>{run.role}</span>
        ) : null}
        <RunStatusBadge status={status} />
        {run.durationMs !== undefined ? (
          <span className={styles.chatDetailDurationChip}>
            {formatMs(run.durationMs)}
          </span>
        ) : null}
      </span>
    </div>
  );

  return (
    <Collapse
      className={styles.chatDetailAgentRunCollapse}
      items={[
        {
          key: String(run.id),
          label: header,
          extra: (
            <Button
              type="link"
              size="small"
              icon={<LinkOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                onViewAgentRun(run.id);
              }}
            >
              {intl.formatMessage({ id: 'chat.detail.viewAgentRun' })}
            </Button>
          ),
          children: (
            <div className={styles.chatDetailAgentRunBody}>
              <div className={styles.chatDetailMetricGrid}>
                {metrics.map((item) => (
                  <div key={item.key} className={styles.chatDetailMetricCard}>
                    <span className={styles.chatDetailMetricLabel}>
                      {item.label}
                    </span>
                    <span className={styles.chatDetailMetricValue}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.chatDetailStatsExtras}>
                <div className={styles.chatDetailStatsExtraBlock}>
                  <span className={styles.chatDetailStatsExtraLabel}>
                    {intl.formatMessage({ id: 'agentRun.filter.finishReason' })}
                  </span>
                  <span className={styles.chatDetailMetricValue}>
                    {run.finishReason ?? '—'}
                  </span>
                </div>
                <div className={styles.chatDetailStatsExtraBlock}>
                  <span className={styles.chatDetailStatsExtraLabel}>
                    {intl.formatMessage({ id: 'chat.detail.toolsUsed' })}
                  </span>
                  <span className={styles.chatDetailStatTags}>
                    {toolNames.length
                      ? toolNames.map((tool) => (
                          <span key={tool} className={styles.chatDetailToolTag}>
                            {tool}
                          </span>
                        ))
                      : '—'}
                  </span>
                </div>
                {runQualityCounts ? (
                  <div className={styles.chatDetailStatsExtraBlock}>
                    <span className={styles.chatDetailStatsExtraLabel}>
                      {intl.formatMessage({ id: 'chat.detail.toolQuality' })}
                    </span>
                    <span className={styles.chatDetailStatTags}>
                      <span className={styles.chatDetailQualityTagSuccess}>
                        {intl.formatMessage(
                          { id: 'chat.detail.quality.high' },
                          { count: runQualityCounts.high ?? 0 },
                        )}
                      </span>
                      <span className={styles.chatDetailQualityTagWarning}>
                        {intl.formatMessage(
                          { id: 'chat.detail.quality.medium' },
                          { count: runQualityCounts.medium ?? 0 },
                        )}
                      </span>
                      <span className={styles.chatDetailQualityTagError}>
                        {intl.formatMessage(
                          { id: 'chat.detail.quality.low' },
                          { count: runQualityCounts.low ?? 0 },
                        )}
                      </span>
                    </span>
                  </div>
                ) : null}
                {nonZeroCodes.length > 0 ? (
                  <div className={styles.chatDetailStatsExtraBlock}>
                    <span className={styles.chatDetailStatsExtraLabel}>
                      {intl.formatMessage({
                        id: 'chat.detail.toolMachineCodes',
                      })}
                    </span>
                    <span className={styles.chatDetailStatTags}>
                      {nonZeroCodes.map(({ code, count }) => (
                        <span key={code} className={styles.chatDetailCodeTag}>
                          {intl.formatMessage({
                            id: machineCodeLabelKey(code),
                            defaultMessage: code,
                          })}{' '}
                          ×{count}
                        </span>
                      ))}
                    </span>
                  </div>
                ) : null}
              </div>

              {run.input ? (
                <div className={styles.chatDetailBlock}>
                  <h4 className={styles.chatDetailBlockTitle}>
                    {intl.formatMessage({ id: 'agentRun.detail.input' })}
                  </h4>
                  <pre className={styles.chatDetailCodeBlock}>{run.input}</pre>
                </div>
              ) : null}

              {run.output ? (
                <div className={styles.chatDetailBlock}>
                  <h4 className={styles.chatDetailBlockTitle}>
                    {intl.formatMessage({ id: 'agentRun.detail.output' })}
                  </h4>
                  <pre className={styles.chatDetailCodeBlock}>
                    {formatMessageContent(run.output)}
                  </pre>
                </div>
              ) : null}

              <div className={styles.chatDetailBlock}>
                <h4 className={styles.chatDetailBlockTitle}>
                  {intl.formatMessage({ id: 'agentRun.detail.steps' })}
                </h4>
                <ChatAgentRunSteps run={run} />
              </div>

              {run.error ? (
                <div className={styles.chatDetailBlock}>
                  <h4 className={styles.chatDetailBlockTitle}>
                    {intl.formatMessage({ id: 'agentRun.detail.error' })}
                  </h4>
                  <pre className={styles.chatDetailCodeBlock}>{run.error}</pre>
                </div>
              ) : null}
            </div>
          ),
        },
      ]}
    />
  );
}
