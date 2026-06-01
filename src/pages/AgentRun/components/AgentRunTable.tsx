import {
  AppTable,
  AppTableActions,
  AppTableButton,
  AppTableCodeCell,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { AgentRun, AgentRunStatus } from '@/types/agent-run';
import { history, useIntl } from '@umijs/max';
import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type AgentRunTableProps = {
  runs: AgentRun[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  detailPath: (id: number) => string;
};

const statusColor: Record<AgentRunStatus, string> = {
  running: 'processing',
  success: 'success',
  failed: 'error',
};

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

const AgentRunTable: React.FC<AgentRunTableProps> = ({
  runs,
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  detailPath,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<AgentRun> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (id: number) => (
        <AppTablePrimaryCell
          title={`#${id}`}
          href={detailPath(id)}
          onLinkClick={stopRowClick}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'agentRun.column.agentId' }),
      dataIndex: 'agentId',
      key: 'agentId',
      width: 110,
    },
    {
      title: intl.formatMessage({ id: 'agentRun.column.sessionId' }),
      dataIndex: 'sessionId',
      key: 'sessionId',
      ellipsis: true,
      render: (sessionId?: string) => <AppTableCodeCell value={sessionId} />,
    },
    {
      title: intl.formatMessage({ id: 'agentRun.column.role' }),
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role?: string) => role ?? '—',
    },
    {
      title: intl.formatMessage({ id: 'agentRun.column.status' }),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status?: AgentRunStatus) =>
        status ? <Tag color={statusColor[status]}>{status}</Tag> : '—',
    },
    {
      title: intl.formatMessage({ id: 'agentRun.column.step' }),
      key: 'step',
      width: 130,
      render: (_, record) => `${record.currentStep ?? 0}/${record.maxSteps ?? 0}`,
    },
    {
      title: intl.formatMessage({ id: 'agentRun.column.durationMs' }),
      dataIndex: 'durationMs',
      key: 'durationMs',
      width: 130,
      render: (durationMs?: number) => durationMs ?? '—',
    },
    {
      title: intl.formatMessage({ id: 'agentRun.column.createdAt' }),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt?: string) => createdAt ?? '—',
    },
    {
      title: intl.formatMessage({ id: 'agentRun.column.actions' }),
      key: 'actions',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <AppTableActions>
          <AppTableButton
            onClick={(event) => {
              event.stopPropagation();
              history.push(detailPath(record.id));
            }}
          >
            {intl.formatMessage({ id: 'common.view' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<AgentRun>
      rowKey="id"
      columns={columns}
      dataSource={runs}
      loading={loading}
      scroll={{ x: 980 }}
      clickableRows
      emptyText={intl.formatMessage({ id: 'agentRun.empty.none' })}
      onRowClick={(record) => {
        history.push(detailPath(record.id));
      }}
      pagination={
        onPageChange
          ? {
              page,
              pageSize,
              total,
              pageSizeOptions: [20, 50, 100],
              onChange: onPageChange,
            }
          : false
      }
    />
  );
};

export default AgentRunTable;
