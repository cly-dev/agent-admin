import { useIntl } from '@umijs/max';
import {
  actionsGroupedByPhase,
  WORKFLOW_PHASE_VISUAL,
  type WorkflowNodePhase,
} from '../workflowNodePhase';
import styles from '../index.module.scss';

type WorkflowPhaseLegendProps = {
  profile: string;
};

const WorkflowPhaseLegend: React.FC<WorkflowPhaseLegendProps> = ({ profile }) => {
  const intl = useIntl();
  const groups = actionsGroupedByPhase(profile);

  return (
    <div className={styles.workflowPhaseLegend}>
      <span className={styles.workflowPhaseLegendTitle}>
        {intl.formatMessage({ id: 'workflow.flowCanvas.phaseLegend' })}
      </span>
      <div className={styles.workflowPhaseLegendItems}>
        {groups.map((group) => (
          <PhaseLegendItem
            key={group.phase}
            phase={group.phase}
            label={intl.formatMessage({ id: `workflow.phase.${group.phase}` })}
            color={WORKFLOW_PHASE_VISUAL[group.phase].strip}
          />
        ))}
      </div>
    </div>
  );
};

function PhaseLegendItem({
  phase,
  label,
  color,
}: {
  phase: WorkflowNodePhase;
  label: string;
  color: string;
}) {
  return (
    <span className={styles.workflowPhaseLegendItem} data-phase={phase}>
      <span
        className={styles.workflowPhaseLegendSwatch}
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export default WorkflowPhaseLegend;
