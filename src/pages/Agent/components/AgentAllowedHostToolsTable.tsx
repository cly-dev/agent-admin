import {
  AppTable,
  AppTableActions,
  AppTableButton,
  AppTableCodeCell,
  AppTableDescription,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { HostTool } from '@/types/host-tool';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type AgentAllowedHostToolsTableProps = {
  tools: HostTool[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  unbindSubmittingId?: number | null;
  onPageChange?: (page: number, pageSize: number) => void;
  onUnbind: (hostToolId: number) => void;
};

const AgentAllowedHostToolsTable: React.FC<AgentAllowedHostToolsTableProps> = ({
  tools,
  loading = false,
  page,
  pageSize,
  total,
  unbindSubmittingId = null,
  onPageChange,
  onUnbind,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<HostTool> = [
    {
      title: intl.formatMessage({ id: 'agent.hostTools.column.name' }),
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (value: string, record) => (
        <AppTablePrimaryCell title={value} meta={`#${record.id}`} />
      ),
    },
    {
      title: intl.formatMessage({ id: 'agent.hostTools.column.pageScope' }),
      dataIndex: 'pageScope',
      key: 'pageScope',
      width: 140,
      render: (value?: string | null) =>
        value ? (
          <AppTableCodeCell value={value} />
        ) : (
          intl.formatMessage({ id: 'hostTool.pageScope.generic' })
        ),
    },
    {
      title: intl.formatMessage({ id: 'agent.hostTools.column.exposure' }),
      dataIndex: 'exposure',
      key: 'exposure',
      width: 120,
      render: (value: string) => (
        <Tag>
          {intl.formatMessage({
            id: `hostTool.exposure.${value}`,
            defaultMessage: value,
          })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'agent.hostTools.column.description' }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value: string) => (
        <AppTableDescription>{value || '—'}</AppTableDescription>
      ),
    },
    {
      title: intl.formatMessage({ id: 'agent.hostTools.column.actions' }),
      key: 'actions',
      width: 100,
      render: (_: unknown, record) => (
        <AppTableActions>
          <AppTableButton
            variant="danger"
            disabled={unbindSubmittingId === record.id}
            onClick={() => onUnbind(record.id)}
          >
            {intl.formatMessage({ id: 'agent.hostTools.unbind' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<HostTool>
      rowKey="id"
      columns={columns}
      dataSource={tools}
      loading={loading}
      pagination={
        onPageChange
          ? {
              page,
              pageSize,
              total,
              onChange: onPageChange,
            }
          : false
      }
      emptyText={intl.formatMessage({ id: 'agent.hostTools.empty' })}
    />
  );
};

export default AgentAllowedHostToolsTable;
