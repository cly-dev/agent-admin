import { useIntl } from '@umijs/max';
import styles from '../index.module.scss';
import type {
  SkillHostToolTabKey,
  SkillHostToolTabRow,
} from '../skillHostTools';
import type { SkillToolRow } from '../useSkillDetail';
import SkillHostToolsPanel from './SkillHostToolsPanel';
import SkillToolsTable from './SkillToolsTable';

type SkillToolsBindingPanelProps = {
  resolvedAgentId: number;
  toolRows: SkillToolRow[];
  selectedToolIds: number[];
  mutationHostToolRows: SkillHostToolTabRow[];
  planHostToolRows: SkillHostToolTabRow[];
  useCustomHostToolBinding: boolean;
  agentToolsLoading: boolean;
  hostToolsLoading: boolean;
  saving?: boolean;
  onToolSelectionChange: (toolIds: number[]) => void;
  onToolRequiredChange: (toolId: number, isRequired: boolean) => void;
  onUseCustomHostToolBindingChange: (value: boolean) => void;
  onHostToolRowChange: (
    tab: SkillHostToolTabKey,
    hostToolId: number,
    patch: Partial<
      Pick<
        SkillHostToolTabRow,
        'enabled' | 'trigger' | 'priority' | 'isRequired' | 'argsTemplateJson'
      >
    >,
  ) => void;
};

const SkillToolsBindingPanel: React.FC<SkillToolsBindingPanelProps> = ({
  resolvedAgentId,
  toolRows,
  selectedToolIds,
  mutationHostToolRows,
  planHostToolRows,
  useCustomHostToolBinding,
  agentToolsLoading,
  hostToolsLoading,
  saving = false,
  onToolSelectionChange,
  onToolRequiredChange,
  onUseCustomHostToolBindingChange,
  onHostToolRowChange,
}) => {
  const intl = useIntl();
  const agentReady = resolvedAgentId > 0;

  return (
    <div className={styles.skillToolsBindingPanel}>
      <p className={styles.skillDetailSectionHint}>
        {intl.formatMessage({ id: 'skill.detail.toolsBindingHint' })}
      </p>

      <section className={styles.skillToolsSection}>
        <div className={styles.skillToolsSectionHeader}>
          <h3 className={styles.skillDetailSectionTitle}>
            {intl.formatMessage({ id: 'skill.detail.tab.httpTools' })}
          </h3>
          <p className={styles.skillDetailSectionHint}>
            {intl.formatMessage({ id: 'skill.detail.toolsHint' })}
          </p>
        </div>
        {!agentReady ? (
          <p className={styles.skillToolsSectionEmpty}>
            {intl.formatMessage({ id: 'skill.detail.toolsSelectAgentFirst' })}
          </p>
        ) : (
          <SkillToolsTable
            rows={toolRows}
            selectedToolIds={selectedToolIds}
            loading={agentToolsLoading}
            saving={saving}
            onSelectionChange={onToolSelectionChange}
            onRequiredChange={onToolRequiredChange}
          />
        )}
      </section>

      <section className={styles.skillToolsSection}>
        <div className={styles.skillToolsSectionHeader}>
          <h3 className={styles.skillDetailSectionTitle}>
            {intl.formatMessage({ id: 'skill.detail.tab.hostTools' })}
          </h3>
        </div>
        {!agentReady ? (
          <p className={styles.skillToolsSectionEmpty}>
            {intl.formatMessage({ id: 'skill.detail.toolsSelectAgentFirst' })}
          </p>
        ) : (
          <SkillHostToolsPanel
            useCustomBinding={useCustomHostToolBinding}
            mutationRows={mutationHostToolRows}
            planRows={planHostToolRows}
            loading={hostToolsLoading}
            saving={saving}
            onUseCustomBindingChange={onUseCustomHostToolBindingChange}
            onRowChange={onHostToolRowChange}
          />
        )}
      </section>
    </div>
  );
};

export default SkillToolsBindingPanel;
