import { useIntl } from '@umijs/max';
import styles from '../../Workflow/index.module.scss';

type IntentStepSummary = {
  id: string;
  name?: string;
  operation?: string;
  objective?: string;
  channel?: string;
};

type FlowIntentTimelineProps = {
  intent: unknown;
};

function parseSteps(intent: unknown): IntentStepSummary[] {
  if (typeof intent !== 'object' || intent === null) {
    return [];
  }
  const steps = (intent as { steps?: unknown }).steps;
  if (!Array.isArray(steps)) {
    return [];
  }
  const result: IntentStepSummary[] = [];
  for (const raw of steps) {
    if (typeof raw !== 'object' || raw === null) {
      continue;
    }
    const step = raw as Record<string, unknown>;
    const id = String(step.id ?? '').trim();
    if (!id) {
      continue;
    }
    result.push({
      id,
      name: typeof step.name === 'string' ? step.name : undefined,
      operation:
        typeof step.operation === 'string' ? step.operation : undefined,
      objective:
        typeof step.objective === 'string' ? step.objective : undefined,
      channel: typeof step.channel === 'string' ? step.channel : undefined,
    });
  }
  return result;
}

function parseEdges(
  intent: unknown,
): Array<{ from: string; to: string; kind?: string }> {
  if (typeof intent !== 'object' || intent === null) {
    return [];
  }
  const edges = (intent as { edges?: unknown }).edges;
  if (!Array.isArray(edges)) {
    return [];
  }
  const result: Array<{ from: string; to: string; kind?: string }> = [];
  for (const raw of edges) {
    if (typeof raw !== 'object' || raw === null) {
      continue;
    }
    const edge = raw as Record<string, unknown>;
    const from = String(edge.from ?? '').trim();
    const to = String(edge.to ?? '').trim();
    if (!from || !to) {
      continue;
    }
    result.push({
      from,
      to,
      kind: typeof edge.kind === 'string' ? edge.kind : undefined,
    });
  }
  return result;
}

const FlowIntentTimeline: React.FC<FlowIntentTimelineProps> = ({ intent }) => {
  const intl = useIntl();
  const steps = parseSteps(intent);
  const edges = parseEdges(intent);
  const entryStepId =
    typeof intent === 'object' &&
    intent !== null &&
    typeof (intent as { entryStepId?: unknown }).entryStepId === 'string'
      ? (intent as { entryStepId: string }).entryStepId
      : steps[0]?.id;

  if (steps.length === 0) {
    return (
      <p className={styles.flowIntentEmpty}>
        {intl.formatMessage({ id: 'flow.intent.empty' })}
      </p>
    );
  }

  return (
    <div className={styles.flowIntentTimeline}>
      <ol className={styles.flowIntentStepList}>
        {steps.map((step, index) => (
          <li key={step.id} className={styles.flowIntentStep}>
            <span className={styles.flowIntentStepIndex}>{index + 1}</span>
            <div className={styles.flowIntentStepBody}>
              <div className={styles.flowIntentStepHeader}>
                <span className={styles.flowIntentStepId}>
                  {step.name?.trim() || step.id}
                  {entryStepId === step.id ? (
                    <span className={styles.flowIntentEntryBadge}>
                      {intl.formatMessage({ id: 'flow.intent.entry' })}
                    </span>
                  ) : null}
                </span>
                {step.operation ? (
                  <span className={styles.flowIntentOp}>
                    {step.operation}
                    {step.channel ? `(${step.channel})` : ''}
                  </span>
                ) : null}
              </div>
              {step.objective ? (
                <p className={styles.flowIntentObjective}>{step.objective}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {edges.length > 0 ? (
        <div className={styles.flowIntentEdges}>
          <h3 className={styles.flowIntentEdgesTitle}>
            {intl.formatMessage({ id: 'flow.intent.edges' })}
          </h3>
          <ul className={styles.flowIntentEdgeList}>
            {edges.map((edge) => (
              <li key={`${edge.from}->${edge.to}`}>
                {edge.from} → {edge.to}
                {edge.kind && edge.kind !== 'always' ? ` · ${edge.kind}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default FlowIntentTimeline;
