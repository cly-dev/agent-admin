import {
  AppTable,
  AppTableCodeCell,
  AppTableDescription,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { HostToolSkillTrigger } from '@/types/host-tool';
import { useIntl } from '@umijs/max';
import { Alert, Input, InputNumber, Select, Switch, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PLAN_TRIGGER_OPTIONS,
  type SkillHostToolTabKey,
  type SkillHostToolTabRow,
} from '../skillHostTools';

type SkillHostToolsPanelProps = {
  useCustomBinding: boolean;
  mutationRows: SkillHostToolTabRow[];
  planRows: SkillHostToolTabRow[];
  loading?: boolean;
  saving?: boolean;
  onUseCustomBindingChange: (value: boolean) => void;
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

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

const SkillHostToolsPanel: React.FC<SkillHostToolsPanelProps> = ({
  useCustomBinding,
  mutationRows,
  planRows,
  loading = false,
  saving = false,
  onUseCustomBindingChange,
  onRowChange,
}) => {
  const intl = useIntl();

  const buildColumns = (
    tab: SkillHostToolTabKey,
    showTriggerSelect: boolean,
  ): ColumnsType<SkillHostToolTabRow> => [
    {
      title: intl.formatMessage({ id: 'skill.hostTools.column.name' }),
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (value: string, record) => (
        <AppTablePrimaryCell
          title={value || `#${record.hostToolId}`}
          meta={`#${record.hostToolId}`}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'skill.hostTools.column.pageScope' }),
      dataIndex: 'pageScope',
      key: 'pageScope',
      width: 120,
      render: (value?: string | null) =>
        value ? (
          <AppTableCodeCell value={value} />
        ) : (
          intl.formatMessage({ id: 'hostTool.pageScope.generic' })
        ),
    },
    ...(showTriggerSelect
      ? [
          {
            title: intl.formatMessage({ id: 'skill.hostTools.column.trigger' }),
            key: 'trigger',
            width: 160,
            render: (_value: unknown, record: SkillHostToolTabRow) => (
              <Select
                size="small"
                className="w-full"
                disabled={!record.enabled || saving}
                value={record.trigger}
                options={PLAN_TRIGGER_OPTIONS.map((value) => ({
                  value,
                  label: intl.formatMessage({
                    id: `skill.hostTools.trigger.${value}`,
                  }),
                }))}
                onClick={stopRowClick}
                onChange={(value: HostToolSkillTrigger) =>
                  onRowChange(tab, record.hostToolId, { trigger: value })
                }
              />
            ),
          } as ColumnsType<SkillHostToolTabRow>[number],
        ]
      : []),
    {
      title: intl.formatMessage({ id: 'skill.hostTools.column.priority' }),
      key: 'priority',
      width: 80,
      render: (_value, record) => (
        <InputNumber
          size="small"
          className="w-full"
          min={0}
          disabled={!record.enabled || saving}
          value={record.priority}
          onClick={stopRowClick}
          onChange={(value) =>
            onRowChange(tab, record.hostToolId, {
              priority: typeof value === 'number' ? value : 0,
            })
          }
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'skill.hostTools.column.required' }),
      key: 'isRequired',
      width: 90,
      render: (_value, record) => (
        <Switch
          size="small"
          checked={record.isRequired}
          disabled={!record.enabled || saving}
          onChange={(checked, event) => {
            event?.stopPropagation?.();
            onRowChange(tab, record.hostToolId, { isRequired: checked });
          }}
          onClick={(_, event) => event.stopPropagation()}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'skill.hostTools.column.argsTemplate' }),
      key: 'argsTemplate',
      width: 200,
      render: (_value, record) => (
        <Input
          size="small"
          className="font-mono text-xs"
          disabled={!record.enabled || saving}
          placeholder='{"entityId":"$entity.id"}'
          value={record.argsTemplateJson}
          onClick={stopRowClick}
          onChange={(event) =>
            onRowChange(tab, record.hostToolId, {
              argsTemplateJson: event.target.value,
            })
          }
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'skill.hostTools.column.enabled' }),
      key: 'enabled',
      width: 80,
      fixed: 'right',
      render: (_value, record) => (
        <Switch
          size="small"
          checked={record.enabled}
          disabled={saving}
          onChange={(checked, event) => {
            event?.stopPropagation?.();
            onRowChange(tab, record.hostToolId, { enabled: checked });
          }}
          onClick={(_, event) => event.stopPropagation()}
        />
      ),
    },
  ];

  const renderTable = (
    tab: SkillHostToolTabKey,
    rows: SkillHostToolTabRow[],
    showTrigger: boolean,
  ) => (
    <AppTable<SkillHostToolTabRow>
      rowKey="hostToolId"
      columns={buildColumns(tab, showTrigger)}
      dataSource={rows}
      loading={loading}
      pagination={false}
      scroll={{ x: 980 }}
      emptyText={intl.formatMessage({ id: 'skill.hostTools.tabEmpty' })}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <Alert
        type="info"
        showIcon
        message={intl.formatMessage({ id: 'skill.hostTools.fallback.title' })}
        description={intl.formatMessage({
          id: 'skill.hostTools.fallback.desc',
        })}
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--color-on-surface)]">
            {intl.formatMessage({ id: 'skill.hostTools.customMode' })}
          </div>
          <div className="text-xs text-[var(--color-on-surface-variant)]">
            {intl.formatMessage({ id: 'skill.hostTools.customModeHint' })}
          </div>
        </div>
        <Switch
          checked={useCustomBinding}
          disabled={saving}
          onChange={onUseCustomBindingChange}
        />
      </div>

      {useCustomBinding ? (
        <Tabs
          items={[
            {
              key: 'mutation',
              label: intl.formatMessage({ id: 'skill.hostTools.tab.mutation' }),
              children: (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-[var(--color-on-surface-variant)]">
                    {intl.formatMessage({
                      id: 'skill.hostTools.tab.mutationHint',
                    })}
                  </p>
                  {renderTable('mutation', mutationRows, false)}
                </div>
              ),
            },
            {
              key: 'plan',
              label: intl.formatMessage({ id: 'skill.hostTools.tab.plan' }),
              children: (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-[var(--color-on-surface-variant)]">
                    {intl.formatMessage({ id: 'skill.hostTools.tab.planHint' })}
                  </p>
                  {renderTable('plan', planRows, true)}
                </div>
              ),
            },
          ]}
        />
      ) : (
        <AppTableDescription>
          {intl.formatMessage({ id: 'skill.hostTools.inheritAgent' })}
        </AppTableDescription>
      )}
    </div>
  );
};

export default SkillHostToolsPanel;
