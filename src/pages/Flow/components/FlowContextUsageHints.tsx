import type { FlowIntentOperation } from '@/types/flow-intent';
import { useIntl } from '@umijs/max';
import { Alert, Collapse } from 'antd';
import styles from '../../Workflow/index.module.scss';

const STEP_HINT_IDS: Record<FlowIntentOperation, string> = {
  read: 'flow.intent.stepHint.read',
  judge: 'flow.intent.stepHint.judge',
  deliver: 'flow.intent.stepHint.deliver',
  mutate: 'flow.intent.stepHint.mutate',
};

type FlowPageContextGlobalHintProps = {
  className?: string;
};

/** 画布顶栏 / 创建向导：一次说清 pageContext 与识图入口 */
export const FlowPageContextGlobalHint: React.FC<
  FlowPageContextGlobalHintProps
> = ({ className }) => {
  const intl = useIntl();

  return (
    <Collapse
      bordered={false}
      className={`${styles.flowPageContextGlobal} ${className ?? ''}`.trim()}
      items={[
        {
          key: 'pageContext',
          label: intl.formatMessage({
            id: 'flow.intent.pageContext.globalTitle',
          }),
          children: (
            <p className={styles.flowPageContextGlobalBody}>
              {intl.formatMessage({ id: 'flow.intent.pageContext.globalBody' })}
            </p>
          ),
        },
      ]}
    />
  );
};

type FlowStepContextHintProps = {
  operation: FlowIntentOperation;
  className?: string;
};

/** 节点属性面板：本步吃什么、产出什么 */
export const FlowStepContextHint: React.FC<FlowStepContextHintProps> = ({
  operation,
  className,
}) => {
  const intl = useIntl();

  return (
    <Alert
      type="info"
      showIcon
      className={`${styles.flowStepContextHint} ${className ?? ''}`.trim()}
      message={intl.formatMessage({ id: STEP_HINT_IDS[operation] })}
    />
  );
};

type FlowReadEvidenceHintProps = {
  className?: string;
};

/** read 取证入口：主表单上方的重点说明 */
export const FlowReadEvidenceHint: React.FC<FlowReadEvidenceHintProps> = ({
  className,
}) => {
  const intl = useIntl();

  return (
    <Alert
      type="info"
      showIcon
      className={`${styles.flowReadEvidenceHint} ${className ?? ''}`.trim()}
      message={intl.formatMessage({ id: 'flow.intent.readEvidence.title' })}
      description={
        <ul className={styles.flowReadEvidenceList}>
          <li>
            {intl.formatMessage({ id: 'flow.intent.readEvidence.line1' })}
          </li>
          <li>
            {intl.formatMessage({ id: 'flow.intent.readEvidence.line2' })}
          </li>
          <li>
            {intl.formatMessage({ id: 'flow.intent.readEvidence.line3' })}
          </li>
        </ul>
      }
    />
  );
};

const READ_SCENARIO_KEYS = [
  'pageText',
  'pageImage',
  'listApi',
  'autoReply',
] as const;

type FlowReadScenarioGuideProps = {
  className?: string;
};

/** read 场景快捷说明（折叠） */
export const FlowReadScenarioGuide: React.FC<FlowReadScenarioGuideProps> = ({
  className,
}) => {
  const intl = useIntl();

  return (
    <Collapse
      bordered={false}
      className={`${styles.flowReadScenarioGuide} ${className ?? ''}`.trim()}
      items={[
        {
          key: 'scenarios',
          label: intl.formatMessage({ id: 'flow.intent.readScenarios.title' }),
          children: (
            <dl className={styles.flowReadScenarioList}>
              {READ_SCENARIO_KEYS.map((key) => (
                <div key={key} className={styles.flowReadScenarioItem}>
                  <dt>
                    {intl.formatMessage({
                      id: `flow.intent.readScenarios.${key}.title`,
                    })}
                  </dt>
                  <dd>
                    {intl.formatMessage({
                      id: `flow.intent.readScenarios.${key}.config`,
                    })}
                  </dd>
                </div>
              ))}
            </dl>
          ),
        },
      ]}
    />
  );
};
