import type {
  MessageTurnAgentRun,
  MessageTurnAgentRunStep,
} from '@/types/message-turn';
import { useIntl } from '@umijs/max';
import { Collapse, Tag } from 'antd';
import {
  buildAgentRunStepMetadata,
  stepTypeLabelKey,
  summarizeStepPreview,
} from '../chatTurnDisplay';
import styles from '../index.module.scss';
import { ChatJsonViewer } from './ChatJsonViewer';

function stepPanelKey(step: MessageTurnAgentRunStep, index: number): string {
  return `${step.type ?? 'step'}-${step.step ?? index}-${step.name ?? index}`;
}

type ChatAgentRunStepsProps = {
  run: MessageTurnAgentRun;
};

export function ChatAgentRunSteps({ run }: ChatAgentRunStepsProps) {
  const intl = useIntl();
  const steps = run.steps ?? [];

  if (steps.length === 0) {
    return (
      <p className="text-sm text-on-surface/50">
        {intl.formatMessage({ id: 'chat.detail.noSteps' })}
      </p>
    );
  }

  return (
    <Collapse
      className={styles.chatDetailStepCollapse}
      size="small"
      items={steps.map((step, index) => {
        const type = step.type ?? 'unknown';
        const typeLabel = intl.formatMessage({
          id: stepTypeLabelKey(type),
          defaultMessage: type,
        });
        const header = (
          <div className={styles.chatDetailStepHeader}>
            <Tag>{typeLabel}</Tag>
            {step.step !== undefined ? (
              <span className={styles.chatDetailStepMeta}>#{step.step}</span>
            ) : null}
            {step.name ? (
              <span className={styles.chatDetailStepMeta}>{step.name}</span>
            ) : null}
            <span className={styles.chatDetailStepPreview}>
              {summarizeStepPreview(step)}
            </span>
          </div>
        );

        return {
          key: stepPanelKey(step, index),
          label: header,
          children: (
            <div className={styles.chatDetailStepBody}>
              <ChatJsonViewer
                value={buildAgentRunStepMetadata(step)}
                collapsed={2}
                className={styles.chatDetailStepJson}
              />
            </div>
          ),
        };
      })}
    />
  );
}
