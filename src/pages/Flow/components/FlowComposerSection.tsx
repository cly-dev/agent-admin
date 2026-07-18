import WorkflowPresetPanel from '@/pages/Workflow/components/WorkflowPresetPanel';
import type { WorkflowPresetFormState } from '@/pages/Workflow/workflowPreset';
import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import type { FlowPresetCatalogEntry, FlowProfile } from '@/types/flow';
import type { FlowIntent } from '@/types/flow-intent';
import { useIntl } from '@umijs/max';
import { Segmented } from 'antd';
import type { FlowConfigMode } from '../useFlowDetail';
import FlowIntentEditor from './FlowIntentEditor';
import { FlowPageContextGlobalHint } from './FlowContextUsageHints';
import styles from '../../Workflow/index.module.scss';

import type { FlowBindEntry } from '../flowBindEntry';

type FlowComposerSectionProps = {
  profile: FlowProfile;
  bindEntry?: FlowBindEntry | null;
  configMode: FlowConfigMode;
  onConfigModeChange: (mode: FlowConfigMode) => void;
  presetForm: WorkflowPresetFormState;
  presetCatalog: FlowPresetCatalogEntry[];
  catalogLoading?: boolean;
  onPresetChange: (value: WorkflowPresetFormState) => void;
  intentDraft: FlowIntent;
  onIntentChange: (value: FlowIntent) => void;
  tools: Tool[];
  hostTools: HostTool[];
  toolsLoading?: boolean;
  disabled?: boolean;
  flowName?: string;
};

const FlowComposerSection: React.FC<FlowComposerSectionProps> = ({
  profile,
  bindEntry = null,
  configMode,
  onConfigModeChange,
  presetForm,
  presetCatalog,
  catalogLoading = false,
  onPresetChange,
  intentDraft,
  onIntentChange,
  tools,
  hostTools,
  toolsLoading = false,
  disabled = false,
  flowName,
}) => {
  const intl = useIntl();

  return (
    <section className={styles.flowComposerSection}>
      <header className={styles.flowComposerHeader}>
        <div>
          <h2 className={styles.flowComposerTitle}>
            {intl.formatMessage({ id: 'flow.composer.title' })}
          </h2>
          <p className={styles.flowComposerDesc}>
            {intl.formatMessage({ id: 'flow.composer.desc' })}
          </p>
        </div>
        <Segmented
          className={styles.flowComposerMode}
          value={configMode}
          disabled={disabled}
          options={[
            {
              value: 'preset',
              label: intl.formatMessage({ id: 'flow.configMode.preset' }),
            },
            {
              value: 'intent',
              label: intl.formatMessage({ id: 'flow.configMode.intent' }),
            },
          ]}
          onChange={(value) => onConfigModeChange(value as FlowConfigMode)}
        />
      </header>

      <FlowPageContextGlobalHint className="mb-4" />

      {configMode === 'preset' ? (
        <div className={styles.flowComposerBody}>
          <WorkflowPresetPanel
            profile={profile}
            value={presetForm}
            catalog={presetCatalog}
            catalogLoading={catalogLoading}
            tools={tools}
            hostTools={hostTools}
            toolsLoading={toolsLoading}
            disabled={disabled}
            section="all"
            productMode="flow"
            bindEntry={bindEntry}
            onChange={onPresetChange}
          />
        </div>
      ) : (
        <div className={styles.flowComposerBody}>
          <FlowIntentEditor
            value={intentDraft}
            profile={profile}
            bindEntry={bindEntry}
            flowName={flowName}
            tools={tools}
            hostTools={hostTools}
            toolsLoading={toolsLoading}
            disabled={disabled}
            onChange={onIntentChange}
          />
        </div>
      )}
    </section>
  );
};

export default FlowComposerSection;
