import {
  AppTable,
  AppTableCodeCell,
  AppTableDescription,
  AppTableIconLink,
  AppTableMethodCell,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import { ExportOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SkillToolRow } from '../useSkillDetail';

type SkillToolsTableProps = {
  rows: SkillToolRow[];
  selectedToolIds: number[];
  loading?: boolean;
  saving?: boolean;
  onSelectionChange: (toolIds: number[]) => void;
  onRequiredChange: (toolId: number, isRequired: boolean) => void;
};

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

const SkillToolsTable: React.FC<SkillToolsTableProps> = ({
  rows,
  selectedToolIds,
  loading = false,
  saving = false,
  onSelectionChange,
  onRequiredChange,
}) => {
  const intl = useIntl();
  const noDescription = intl.formatMessage({ id: 'skill.tools.noDescription' });

  const columns: ColumnsType<SkillToolRow> = [
    {
      title: intl.formatMessage({ id: 'skill.tools.column.name' }),
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (value: string, record) => (
        <AppTablePrimaryCell
          title={value || `#${record.toolId}`}
          meta={`#${record.toolId}`}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'skill.tools.column.method' }),
      dataIndex: 'method',
      key: 'method',
      width: 90,
      render: (value?: string) => <AppTableMethodCell method={value} />,
    },
    {
      title: intl.formatMessage({ id: 'skill.tools.column.path' }),
      dataIndex: 'path',
      key: 'path',
      width: 200,
      render: (value?: string) => <AppTableCodeCell value={value} />,
    },
    {
      title: intl.formatMessage({ id: 'skill.tools.column.description' }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value?: string) => (
        <AppTableDescription>
          {value?.trim() ? value : noDescription}
        </AppTableDescription>
      ),
    },
    {
      title: intl.formatMessage({ id: 'skill.tools.column.required' }),
      key: 'isRequired',
      width: 120,
      render: (_value, record) => {
        const selected = selectedToolIds.includes(record.toolId);
        return (
          <Switch
            size="small"
            checked={record.isRequired}
            disabled={!selected || saving}
            onChange={(checked, event) => {
              event?.stopPropagation?.();
              onRequiredChange(record.toolId, checked);
            }}
            onClick={(_, event) => event.stopPropagation()}
          />
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'skill.tools.column.actions' }),
      key: 'actions',
      width: 80,
      render: (_value, record) => (
        <AppTableIconLink
          href={`/tool/detail/${record.toolId}`}
          title={intl.formatMessage({ id: 'skill.tools.openDetail' })}
          onClick={stopRowClick}
        >
          <ExportOutlined />
        </AppTableIconLink>
      ),
    },
  ];

  return (
    <AppTable<SkillToolRow>
      rowKey="toolId"
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
      rowSelection={{
        selectedRowKeys: selectedToolIds,
        onChange: (keys) => onSelectionChange(keys.map((key) => Number(key))),
        preserveSelectedRowKeys: true,
      }}
      emptyText={intl.formatMessage({ id: 'skill.tools.empty' })}
    />
  );
};

export default SkillToolsTable;
