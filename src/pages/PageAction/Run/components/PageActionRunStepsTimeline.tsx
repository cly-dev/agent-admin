import type { PageActionRunStep } from '@/types/page-action-run';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { useMemo, useState } from 'react';
import {
  groupPageActionRunSteps,
  formatPageActionRunTime,
  isApprovalLifecycleStep,
  summarizePageActionRunStep,
  type PageActionRunTimelineEntry,
} from '../pageActionRunDisplay';
import styles from '../index.module.scss';

type PageActionRunStepsTimelineProps = {
  steps: PageActionRunStep[];
};

function StepTypeBadge({ type }: { type: string }) {
  return <span className={`${styles.runStepType} ${styles[`runStepType${type}`]}`}>{type}</span>;
}

function SingleStepRow({ step }: { step: PageActionRunStep }) {
  const intl = useIntl();
  const detail = summarizePageActionRunStep(step, intl);
  const isApproval = isApprovalLifecycleStep(step);
  const rowClassName = isApproval
    ? `${styles.runTimelineRow} ${styles.runTimelineRowApproval}`
    : styles.runTimelineRow;
  const markerClassName = isApproval
    ? `${styles.runTimelineMarker} ${styles.runTimelineMarkerApproval}`
    : styles.runTimelineMarker;

  return (
    <div className={rowClassName}>
      <div className={markerClassName} />
      <div className={styles.runTimelineContent}>
        <div className={styles.runTimelineHead}>
          <span className={styles.runStepName}>{step.name}</span>
          <StepTypeBadge type={step.type} />
          {isApproval ? (
            <span className={styles.runStepApprovalBadge}>
              {intl.formatMessage({
                id: `pageActionRun.approval.step.${step.name}`,
                defaultMessage: step.name,
              })}
            </span>
          ) : null}
          <span className={styles.runStepTime}>{formatPageActionRunTime(step.at)}</span>
          {step.status ? (
            <span className={styles.runStepStatus}>{step.status}</span>
          ) : null}
        </div>
        {detail && detail !== '—' ? (
          <p className={styles.runStepDetail}>{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

function AppendGroupRow({ entry }: { entry: Extract<PageActionRunTimelineEntry, { kind: 'append-group' }> }) {
  const intl = useIntl();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.runTimelineRow}>
      <div className={styles.runTimelineMarker} />
      <div className={styles.runTimelineContent}>
        <button
          type="button"
          className={styles.runAppendToggle}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? <DownOutlined /> : <RightOutlined />}
          <span className={styles.runStepName}>arg.append</span>
          <StepTypeBadge type="dsl" />
          <span className={styles.runStepMeta}>
            {intl.formatMessage(
              { id: 'pageActionRun.detail.appendGroup' },
              {
                count: entry.count,
                total: entry.totalChunkLength,
              },
            )}
          </span>
          <span className={styles.runStepTime}>
            {formatPageActionRunTime(entry.firstAt)} → {formatPageActionRunTime(entry.lastAt)}
          </span>
        </button>
        {expanded ? (
          <div className={styles.runAppendList}>
            {entry.steps.map((step) => (
              <div key={step.step} className={styles.runAppendItem}>
                <span className={styles.runAppendStep}>#{step.step}</span>
                <span>{formatPageActionRunTime(step.at)}</span>
                <span>{summarizePageActionRunStep(step, intl)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const PageActionRunStepsTimeline: React.FC<PageActionRunStepsTimelineProps> = ({
  steps,
}) => {
  const intl = useIntl();
  const entries = useMemo(() => groupPageActionRunSteps(steps), [steps]);

  if (entries.length === 0) {
    return (
      <p className={styles.runTimelineEmpty}>
        {intl.formatMessage({ id: 'pageActionRun.detail.noSteps' })}
      </p>
    );
  }

  return (
    <div className={styles.runTimeline}>
      {entries.map((entry) =>
        entry.kind === 'append-group' ? (
          <AppendGroupRow key={`append-${entry.steps[0].step}`} entry={entry} />
        ) : (
          <SingleStepRow key={entry.step.step} step={entry.step} />
        ),
      )}
    </div>
  );
};

export default PageActionRunStepsTimeline;
