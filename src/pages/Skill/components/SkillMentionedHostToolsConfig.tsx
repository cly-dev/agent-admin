import type { HostToolSkillTrigger } from '@/types/host-tool';
import { useIntl } from '@umijs/max';
import { Input, InputNumber, Select, Tag } from 'antd';
import {
  PLAN_TRIGGER_OPTIONS,
  type SkillHostToolTabKey,
  type SkillHostToolTabRow,
} from '../skillHostTools';
import styles from './SkillPromptMentionEditor.module.scss';

type SkillMentionedHostToolsConfigProps = {
  mutationRows: SkillHostToolTabRow[];
  planRows: SkillHostToolTabRow[];
  selectedHostToolIds: number[];
  saving?: boolean;
  onRowChange: (
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

type HostToolGroup = {
  hostToolId: number;
  name: string;
  mutationRow?: SkillHostToolTabRow;
  planRow?: SkillHostToolTabRow;
};

function buildGroups(
  mutationRows: SkillHostToolTabRow[],
  planRows: SkillHostToolTabRow[],
  selectedHostToolIds: number[],
): HostToolGroup[] {
  const map = new Map<number, HostToolGroup>();

  for (const row of mutationRows) {
    if (!selectedHostToolIds.includes(row.hostToolId)) {
      continue;
    }
    const existing = map.get(row.hostToolId);
    map.set(row.hostToolId, {
      hostToolId: row.hostToolId,
      name: row.name,
      mutationRow: row,
      planRow: existing?.planRow,
    });
  }

  for (const row of planRows) {
    if (!selectedHostToolIds.includes(row.hostToolId)) {
      continue;
    }
    const existing = map.get(row.hostToolId);
    map.set(row.hostToolId, {
      hostToolId: row.hostToolId,
      name: row.name,
      mutationRow: existing?.mutationRow,
      planRow: row,
    });
  }

  return Array.from(map.values());
}

const SkillMentionedHostToolsConfig: React.FC<
  SkillMentionedHostToolsConfigProps
> = ({
  mutationRows,
  planRows,
  selectedHostToolIds,
  saving = false,
  onRowChange,
}) => {
  const intl = useIntl();
  const groups = buildGroups(mutationRows, planRows, selectedHostToolIds);

  if (groups.length === 0) {
    return null;
  }

  const renderScenario = (
    tab: SkillHostToolTabKey,
    row: SkillHostToolTabRow,
    showTrigger: boolean,
  ) => (
    <div key={`${row.hostToolId}-${tab}`} className={styles.hostToolScenario}>
      <div className={styles.hostToolScenarioHeader}>
        <Tag color="purple">
          {intl.formatMessage({
            id:
              tab === 'mutation'
                ? 'skill.hostTools.tab.mutation'
                : 'skill.hostTools.tab.plan',
          })}
        </Tag>
        {row.exposure ? (
          <Tag>
            {intl.formatMessage({
              id: `hostTool.exposure.${row.exposure}`,
              defaultMessage: row.exposure,
            })}
          </Tag>
        ) : null}
      </div>
      <div className={styles.hostToolScenarioGrid}>
        {showTrigger ? (
          <div>
            <label className={styles.hostToolFieldLabel}>
              {intl.formatMessage({ id: 'skill.hostTools.column.trigger' })}
            </label>
            <Select
              size="small"
              className="w-full"
              disabled={saving}
              value={row.trigger}
              options={PLAN_TRIGGER_OPTIONS.map((value) => ({
                value,
                label: intl.formatMessage({
                  id: `skill.hostTools.trigger.${value}`,
                }),
              }))}
              onChange={(value: HostToolSkillTrigger) =>
                onRowChange(tab, row.hostToolId, { trigger: value })
              }
            />
          </div>
        ) : null}
        <div>
          <label className={styles.hostToolFieldLabel}>
            {intl.formatMessage({ id: 'skill.hostTools.column.priority' })}
          </label>
          <InputNumber
            size="small"
            className="w-full"
            min={0}
            disabled={saving}
            value={row.priority}
            onChange={(value) =>
              onRowChange(tab, row.hostToolId, {
                priority: typeof value === 'number' ? value : 0,
              })
            }
          />
        </div>
        <div className={styles.hostToolScenarioArgs}>
          <label className={styles.hostToolFieldLabel}>
            {intl.formatMessage({ id: 'skill.hostTools.column.argsTemplate' })}
          </label>
          <Input
            size="small"
            className="font-mono text-xs"
            disabled={saving}
            placeholder='{"entityId":"$entity.id"}'
            value={row.argsTemplateJson}
            onChange={(event) =>
              onRowChange(tab, row.hostToolId, {
                argsTemplateJson: event.target.value,
              })
            }
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.hostToolsConfig}>
      <p className={styles.hostToolsConfigTitle}>
        {intl.formatMessage({ id: 'skill.promptMention.hostToolsConfigTitle' })}
      </p>
      <p className={styles.hostToolsConfigHint}>
        {intl.formatMessage({ id: 'skill.promptMention.hostToolsConfigHint' })}
      </p>
      <div className={styles.hostToolsConfigList}>
        {groups.map((group) => (
          <div key={group.hostToolId} className={styles.hostToolConfigCard}>
            <div className={styles.hostToolConfigCardTitle}>@{group.name}</div>
            {group.mutationRow
              ? renderScenario('mutation', group.mutationRow, false)
              : null}
            {group.planRow ? renderScenario('plan', group.planRow, true) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillMentionedHostToolsConfig;
