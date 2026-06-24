import {
  AppTable,
  AppTableActions,
  AppTableButton,
  AppTableCodeCell,
} from '@/components/AppTable';
import { getToolStatus } from '@/pages/Tool/useTools';
import type { Tool } from '@/types/tool';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type CategoryToolsTableProps = {
  tools: Tool[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onConfigure: (toolId: number) => void;
};

const statusColor: Record<string, string> = {
  active: 'success',
  inactive: 'default',
  config_required: 'warning',
};

const CategoryToolsTable: React.FC<CategoryToolsTableProps> = ({
  tools,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onConfigure,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<Tool> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: intl.formatMessage({ id: 'toolCategory.detail.toolName' }),
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({ id: 'toolCategory.detail.toolMethod' }),
      dataIndex: 'method',
      key: 'method',
      width: 90,
    },
    {
      title: intl.formatMessage({ id: 'toolCategory.detail.toolPath' }),
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      render: (value: string) => <AppTableCodeCell value={value} empty="—" />,
    },
    {
      title: intl.formatMessage({ id: 'toolCategory.detail.toolIntegration' }),
      key: 'integration',
      width: 160,
      ellipsis: true,
      render: (_, record) =>
        record.integration?.name ?? `#${record.integrationId}`,
    },
    {
      title: intl.formatMessage({ id: 'toolCategory.detail.toolRisk' }),
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 80,
    },
    {
      title: intl.formatMessage({ id: 'toolCategory.detail.toolStatus' }),
      key: 'status',
      width: 120,
      render: (_, record) => {
        const status = getToolStatus(record);
        const statusMessageId =
          status === 'active'
            ? 'tool.status.active'
            : status === 'config_required'
              ? 'tool.status.configRequired'
              : 'tool.status.inactive';
        return (
          <Tag color={statusColor[status]}>
            {intl.formatMessage({ id: statusMessageId })}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'toolCategory.detail.toolUpdatedAt' }),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'toolCategory.column.actions' }),
      key: 'actions',
      align: 'right',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <AppTableActions>
          <AppTableButton onClick={() => onConfigure(record.id)}>
            {intl.formatMessage({ id: 'common.configure' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<Tool>
      rowKey="id"
      columns={columns}
      dataSource={tools}
      loading={loading}
      scroll={{ x: 1100 }}
      pagination={{
        page,
        pageSize,
        total,
        pageSizeOptions: [20, 50, 100],
        onChange: onPageChange,
      }}
    />
  );
};

export default CategoryToolsTable;
