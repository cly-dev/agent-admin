import { AppTable, AppTableActions, AppTableButton, AppTableCodeCell } from '@/components/AppTable';
import type { UserAppRelation } from '@/types/user-app';
import { history, useIntl } from '@umijs/max';
import { Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type UserTableProps = {
  list: UserAppRelation[];
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

  const confirmDelete = (record: UserAppRelation) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'user.deleteTitle' }),
      centered: true,
      okButtonProps: { danger: true },
      onOk: async () => {
        await onDelete(record.id);
      },
    });
  };

  const columns: ColumnsType<UserAppRelation> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    {
      title: intl.formatMessage({ id: 'user.column.userId' }),
      dataIndex: 'userId',
      key: 'userId',
      width: 110,
      render: (value: number) => `#${value}`,
    },
    {
      title: intl.formatMessage({ id: 'user.column.username' }),
      dataIndex: 'username',
      key: 'username',
      width: 160,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'user.column.userEmail' }),
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 220,
      render: (value?: string) => <AppTableCodeCell value={value} empty="—" />,
    },
    {
      title: intl.formatMessage({ id: 'user.column.appId' }),
      dataIndex: 'appId',
      key: 'appId',
      width: 110,
      render: (value: number) => `#${value}`,
    },
    {
      title: intl.formatMessage({ id: 'user.column.appName' }),
      dataIndex: 'appName',
      key: 'appName',
      width: 160,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'user.column.roleId' }),
      dataIndex: 'roleId',
      key: 'roleId',
      width: 110,
      render: (value: number) => `#${value}`,
    },
    {
      title: intl.formatMessage({ id: 'user.column.roleName' }),
      dataIndex: 'roleName',
      key: 'roleName',
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
      width: 180,
      render: (_, record) => (
        <AppTableActions>
          <AppTableButton onClick={() => history.push(`/user/detail/${record.userId}`)}>
            {intl.formatMessage({ id: 'common.configure' })}
          </AppTableButton>
          <AppTableButton danger onClick={() => confirmDelete(record)}>
            {intl.formatMessage({ id: 'common.delete' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<UserAppRelation>
      rowKey="id"
      columns={columns}
      dataSource={list}
      loading={loading}
      scroll={{ x: 1500 }}
      emptyText={intl.formatMessage({ id: 'user.empty.none' })}
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

export default UserTable;
