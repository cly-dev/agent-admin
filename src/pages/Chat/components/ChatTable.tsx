import {
  AppTable,
  AppTableActions,
  AppTableBooleanStatusCell,
  AppTableButton,
  AppTableCodeCell,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { Session } from '@/types/session';
import { history, useIntl } from '@umijs/max';
import type { ColumnsType } from 'antd/es/table';

type ChatTableProps = {
  sessions: Session[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  detailPath: (id: string) => string;
};

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

const ChatTable: React.FC<ChatTableProps> = ({
  sessions,
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  detailPath,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<Session> = [
    {
      title: intl.formatMessage({ id: 'chat.column.id' }),
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (id: string) => (
        <AppTablePrimaryCell title={id} href={detailPath(id)} onLinkClick={stopRowClick} />
      ),
    },
    {
      title: intl.formatMessage({ id: 'chat.column.user' }),
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
      render: (userId?: number) => (userId ? `#${userId}` : '—'),
    },
    {
      title: intl.formatMessage({ id: 'chat.column.agent' }),
      dataIndex: 'agentId',
      key: 'agentId',
      width: 120,
      render: (agentId?: number) => (agentId ? `#${agentId}` : '—'),
    },
    {
      title: intl.formatMessage({ id: 'chat.column.project' }),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title?: string) => title || '—',
    },
    {
      title: intl.formatMessage({ id: 'chat.column.messages' }),
      dataIndex: 'messageCount',
      key: 'messageCount',
      width: 100,
      render: (messageCount?: number) => messageCount ?? 0,
    },
    {
      title: intl.formatMessage({ id: 'chat.column.rating' }),
      dataIndex: 'rated',
      key: 'rated',
      width: 120,
      align: 'center',
      render: (rated?: boolean) => (
        <AppTableBooleanStatusCell
          value={rated}
          activeLabel={intl.formatMessage({ id: 'chat.rated' })}
          inactiveLabel={intl.formatMessage({ id: 'chat.unrated' })}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'chat.column.updatedAt' }),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (updatedAt?: string) => <AppTableCodeCell value={updatedAt} empty="—" />,
    },
    {
      title: intl.formatMessage({ id: 'chat.column.actions' }),
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
    <AppTable<Session>
      rowKey="id"
      columns={columns}
      dataSource={sessions}
      loading={loading}
      scroll={{ x: 1000 }}
      clickableRows
      emptyText={intl.formatMessage({ id: 'chat.empty.none' })}
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

export default ChatTable;
