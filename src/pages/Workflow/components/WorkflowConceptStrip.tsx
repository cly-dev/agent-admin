import type { WorkflowListItem } from '@/types/workflow';
import { useIntl } from '@umijs/max';
import { useMemo } from 'react';
import styles from '../index.module.scss';

type WorkflowConceptStripProps = {
  total: number;
  list: WorkflowListItem[];
};

const PROFILE_KEYS = ['chat_skill', 'page_action', 'shared'] as const;

const WorkflowConceptStrip: React.FC<WorkflowConceptStripProps> = ({
  total,
  list,
}) => {
  const intl = useIntl();

  const activeOnPage = useMemo(
    () => list.filter((item) => item.isActive).length,
    [list],
  );

  const profileCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of list) {
      counts[item.profile] = (counts[item.profile] ?? 0) + 1;
    }
    return counts;
  }, [list]);

  return (
    <section className={styles.conceptStrip} aria-label={intl.formatMessage({ id: 'workflow.list.conceptAria' })}>
      <div className={styles.conceptStripRail} aria-hidden>
        <span className={styles.conceptStripNode} />
        <span className={styles.conceptStripConnector} />
        <span className={styles.conceptStripNode} />
        <span className={styles.conceptStripConnector} />
        <span className={styles.conceptStripNode} />
        <span className={styles.conceptStripConnector} />
        <span className={`${styles.conceptStripNode} ${styles.conceptStripNodeEnd}`} />
      </div>

      <div className={styles.conceptStripBody}>
        <p className={styles.conceptStripHint}>
          {intl.formatMessage({ id: 'workflow.list.pipelineHint' })}
        </p>
        <p className={styles.conceptStripMeta}>
          {intl.formatMessage(
            { id: 'workflow.list.meta' },
            { total, active: activeOnPage },
          )}
        </p>
      </div>

      <ul className={styles.conceptStripLegend}>
        {PROFILE_KEYS.map((profile) => (
          <li key={profile}>
            <span
              className={`${styles.profilePill} ${styles[`profilePill_${profile}`]}`}
            >
              {intl.formatMessage({ id: `workflow.profile.${profile}` })}
            </span>
            {list.length > 0 ? (
              <span className={styles.conceptStripLegendCount}>
                {profileCounts[profile] ?? 0}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default WorkflowConceptStrip;
