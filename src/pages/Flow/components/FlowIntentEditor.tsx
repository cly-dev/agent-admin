import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import type { FlowProfile } from '@/types/flow';
import type { FlowIntent } from '@/types/flow-intent';
import { useIntl } from '@umijs/max';
import { Alert, Collapse } from 'antd';
import { useMemo } from 'react';
import { serializeIntent } from '../flowIntentEditor';
import styles from '../../Workflow/index.module.scss';
import IntentFlowCanvas from './IntentFlowCanvas';

import type { FlowBindEntry } from '../flowBindEntry';
import { flowAllowsMutate } from '../flowBindEntry';

type FlowIntentEditorProps = {
  value: FlowIntent;
  profile: FlowProfile;
  bindEntry?: FlowBindEntry | null;
  flowName?: string;
  tools: Tool[];
  hostTools: HostTool[];
  toolsLoading?: boolean;
  disabled?: boolean;
  onChange: (next: FlowIntent) => void;
};

const FlowIntentEditor: React.FC<FlowIntentEditorProps> = ({
  value,
  profile,
  bindEntry = null,
  flowName,
  tools,
  hostTools,
  toolsLoading = false,
  disabled = false,
  onChange,
}) => {
  const intl = useIntl();

  const rawIntentJson = useMemo(() => {
    try {
      return JSON.stringify(serializeIntent(value), null, 2);
    } catch {
      return '';
    }
  }, [value]);

  const allowsMutate = flowAllowsMutate(bindEntry);
  const hasForbiddenMutate =
    !allowsMutate && value.steps.some((step) => step.operation === 'mutate');

  return (
    <div className={styles.flowIntentEditor}>
      <header className={styles.flowIntentToolbar}>
        <div className={styles.flowIntentToolbarMeta}>
          {flowName ? (
            <span className={styles.flowIntentToolbarName}>{flowName}</span>
          ) : null}
          <span className={styles.flowIntentToolbarHint}>
            {intl.formatMessage({ id: 'flow.intent.canvas.modeHint' })}
          </span>
        </div>
      </header>

      {hasForbiddenMutate ? (
        <Alert
          type="error"
          showIcon
          className="mb-3"
          message={intl.formatMessage({
            id: 'flow.intent.validation.mutateForbidden',
          })}
        />
      ) : null}

      <IntentFlowCanvas
        value={{ ...value, profile: 'shared' }}
        profile="shared"
        bindEntry={bindEntry}
        tools={tools}
        hostTools={hostTools}
        toolsLoading={toolsLoading}
        disabled={disabled}
        onChange={onChange}
      />

      <Collapse
        className="mt-4"
        bordered={false}
        items={[
          {
            key: 'raw',
            label: intl.formatMessage({ id: 'flow.intent.rawJsonTitle' }),
            children: (
              <>
                <p className={styles.flowIntentEditorHint}>
                  {intl.formatMessage({ id: 'flow.intent.rawJsonHint' })}
                </p>
                <pre className={styles.flowIntentRawJson}>{rawIntentJson}</pre>
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default FlowIntentEditor;
