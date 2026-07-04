import {
  AppTable,
  AppTableActions,
  AppTableButton,
  AppTableCodeCell,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { AdminUser } from '@/types/admin-user';
import { getAdminRoleLabelKey } from '@/utils/admin-role';
import { useIntl } from '@umijs/max';
import { Modal, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type AdminUserTableProps = {
  list: AdminUser[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (record: AdminUser) => void;
  onResetPassword: (record: AdminUser) => Promise<void>;
};

const AdminUserTable: React.FC<AdminUserTableProps> = ({
  list,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onEdit,
  onResetPassword,
}) => {
  const intl = useIntl();

  const confirmResetPassword = (record: AdminUser) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'adminUser.resetPasswordTitle' }),
      content: intl.formatMessage(
        { id: 'adminUser.resetPasswordConfirm' },
        { email: record.email },
      ),
      centered: true,
      okText: intl.formatMessage({ id: 'adminUser.resetPasswordAction' }),
      onOk: async () => {
        await onResetPassword(record);
      },
    });
  };

  const columns: ColumnsType<AdminUser> = [
    {
      title: intl.formatMessage({ id: 'adminUser.column.username' }),
      dataIndex: 'username',
      key: 'username',
      width: 160,
      render: (value: string, record) => (
        <AppTablePrimaryCell title={value} meta={`#${record.id}`} />
      ),
    },
    {
      title: intl.formatMessage({ id: 'adminUser.column.email' }),
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (value: string) => <AppTableCodeCell value={value} empty="—" />,
    },
    {
      title: intl.formatMessage({ id: 'adminUser.column.role' }),
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (value: AdminUser['role']) => (
        <Tag color="blue">
          {intl.formatMessage({ id: getAdminRoleLabelKey(value) })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'adminUser.column.status' }),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (value: boolean) => (
        <Tag color={value ? 'success' : 'default'}>
          {value
            ? intl.formatMessage({ id: 'adminUser.status.active' })
            : intl.formatMessage({ id: 'adminUser.status.inactive' })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'adminUser.column.mustChangePassword' }),
      dataIndex: 'mustChangePassword',
      key: 'mustChangePassword',
      width: 120,
      render: (value: boolean) =>
        value
          ? intl.formatMessage({ id: 'adminUser.mustChangePassword.yes' })
          : intl.formatMessage({ id: 'adminUser.mustChangePassword.no' }),
    },
    {
      title: intl.formatMessage({ id: 'adminUser.column.createdAt' }),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'adminUser.column.actions' }),
      key: 'actions',
      align: 'right',
      width: 220,
      render: (_, record) => (
        <AppTableActions>
          <AppTableButton variant="edit" onClick={() => onEdit(record)}>
            {intl.formatMessage({ id: 'common.edit' })}
          </AppTableButton>
          <AppTableButton
            variant="neutral"
            onClick={() => confirmResetPassword(record)}
          >
            {intl.formatMessage({ id: 'adminUser.resetPasswordAction' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<AdminUser>
      rowKey="id"
      columns={columns}
      dataSource={list}
      loading={loading}
      scroll={{ x: 1100 }}
      emptyText={intl.formatMessage({ id: 'adminUser.empty.none' })}
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

export default AdminUserTable;
