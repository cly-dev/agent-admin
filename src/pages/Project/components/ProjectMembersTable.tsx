import {
  AppTable,
  AppTableActions,
  AppTableButton,
  AppTableCodeCell,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { UserAppRelation } from '@/types/user-app';
import { history, useIntl } from '@umijs/max';
import { Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type ProjectMembersTableProps = {
  members: UserAppRelation[];
  loading?: boolean;
  removingId?: number | null;
  editingRoleId?: number | null;
  onEditRole: (member: UserAppRelation) => void;
  onRemove: (relationId: number) => Promise<void>;
};

function userDetailPath(userId: number) {
  return `/user/detail/${userId}`;
}

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

const ProjectMembersTable: React.FC<ProjectMembersTableProps> = ({
  members,
  loading = false,
  removingId = null,
  editingRoleId = null,
  onEditRole,
  onRemove,
}) => {
  const intl = useIntl();

  const confirmRemove = (record: UserAppRelation, event: React.MouseEvent) => {
    event.stopPropagation();
    Modal.confirm({
      title: intl.formatMessage({ id: 'project.members.removeConfirm' }),
      content: intl.formatMessage(
        { id: 'project.members.removeConfirmDesc' },
        {
          name: record.username || record.userEmail || `#${record.userId}`,
        },
      ),
      okText: intl.formatMessage({ id: 'common.delete' }),
      cancelText: intl.formatMessage({ id: 'common.cancel' }),
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => onRemove(record.id),
    });
  };

  const columns: ColumnsType<UserAppRelation> = [
    {
      title: intl.formatMessage({ id: 'project.members.column.user' }),
      key: 'user',
      ellipsis: true,
      render: (_, record) => (
        <AppTablePrimaryCell
          title={record.username || record.userEmail || `#${record.userId}`}
          meta={
            record.userEmail && record.username
              ? record.userEmail
              : `ID ${record.userId}`
          }
          href={userDetailPath(record.userId)}
          onLinkClick={stopRowClick}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'project.members.column.role' }),
      key: 'role',
      width: 160,
      ellipsis: true,
      render: (_, record) =>
        record.roleName || (record.roleId ? `#${record.roleId}` : '—'),
    },
    {
      title: intl.formatMessage({ id: 'project.members.column.relationId' }),
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number) => <AppTableCodeCell value={String(id)} />,
    },
    {
      title: intl.formatMessage({ id: 'project.members.column.joinedAt' }),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'project.members.column.actions' }),
      key: 'actions',
      align: 'right',
      width: 180,
      render: (_, record) => (
        <AppTableActions>
          <AppTableButton
            disabled={removingId === record.id || editingRoleId === record.id}
            onClick={(event) => {
              event.stopPropagation();
              onEditRole(record);
            }}
          >
            {intl.formatMessage({ id: 'project.members.editRole' })}
          </AppTableButton>
          <AppTableButton
            danger
            disabled={removingId === record.id || editingRoleId === record.id}
            onClick={(event) => confirmRemove(record, event)}
          >
            {intl.formatMessage({ id: 'project.members.remove' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<UserAppRelation>
      rowKey="id"
      columns={columns}
      dataSource={members}
      loading={loading}
      scroll={{ x: 860 }}
      clickableRows
      emptyText={intl.formatMessage({ id: 'project.members.empty' })}
      onRowClick={(record) => {
        history.push(userDetailPath(record.userId));
      }}
      pagination={false}
    />
  );
};

export default ProjectMembersTable;
