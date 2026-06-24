import {
  AppTable,
  AppTableActions,
  AppTableButton,
  AppTableCodeCell,
} from '@/components/AppTable';
import type { User } from '@/types/user';
import { history, useIntl } from '@umijs/max';
import { Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type UserTableProps = {
  list: User[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onDelete: (id: number) => Promise<void>;
};

const UserTable: React.FC<UserTableProps> = ({
  list,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onDelete,
}) => {
  const intl = useIntl();

  const confirmDelete = (record: User) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'user.deleteTitle' }),
      centered: true,
      okButtonProps: { danger: true },
      onOk: async () => {
        await onDelete(record.id);
      },
    });
  };

  const columns: ColumnsType<User> = [
    {
      title: intl.formatMessage({ id: 'user.column.id' }),
      dataIndex: 'id',
      key: 'id',
      width: 90,
    },
    {
      title: intl.formatMessage({ id: 'user.column.email' }),
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (value: string) => <AppTableCodeCell value={value} empty="—" />,
    },
    {
      title: intl.formatMessage({ id: 'user.column.username' }),
      dataIndex: 'username',
      key: 'username',
      width: 160,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'user.column.employeeId' }),
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 140,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'user.column.updatedAt' }),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'user.column.actions' }),
      key: 'actions',
      align: 'right',
      width: 220,
      render: (_, record) => (
        <AppTableActions>
          <AppTableButton
            variant="edit"
            onClick={() => history.push(`/user/detail/${record.id}`)}
          >
            {intl.formatMessage({ id: 'common.edit' })}
          </AppTableButton>
          <AppTableButton
            variant="danger"
            onClick={() => confirmDelete(record)}
          >
            {intl.formatMessage({ id: 'common.delete' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<User>
      rowKey="id"
      columns={columns}
      dataSource={list}
      loading={loading}
      scroll={{ x: 1100 }}
      emptyText={intl.formatMessage({ id: 'user.empty.none' })}
      pagination={{
        page,
        pageSize,
        total,
        pageSizeOptions: [20, 50, 100],
        onChange: onPageChange,
      }}
      clickableRows
      onRowClick={(record) => history.push(`/user/detail/${record.id}`)}
    />
  );
};

export default UserTable;
