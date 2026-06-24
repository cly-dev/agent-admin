import {
  AppTable,
  AppTableActions,
  AppTableButton,
} from '@/components/AppTable';
import type { Skill } from '@/types/skill';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type SkillTableProps = {
  list: Skill[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (record: Skill) => void;
  onDelete: (record: Skill) => void;
};

const SkillTable: React.FC<SkillTableProps> = ({
  list,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
  onDelete,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<Skill> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: intl.formatMessage({ id: 'skill.column.name' }),
      dataIndex: 'name',
      key: 'name',
      width: 160,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({ id: 'skill.column.capabilityKey' }),
      dataIndex: 'capabilityKey',
      key: 'capabilityKey',
      width: 160,
      ellipsis: true,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'skill.column.agent' }),
      key: 'agent',
      width: 140,
      render: (_value, record) => {
        const name = record.agentName?.trim() || record.agent?.name?.trim();
        if (name) {
          return `${name} (#${record.agentId})`;
        }
        return record.agentId ? `#${record.agentId}` : '—';
      },
    },
    {
      title: intl.formatMessage({ id: 'skill.column.toolCount' }),
      dataIndex: 'toolCount',
      key: 'toolCount',
      width: 90,
      render: (value?: number) => (value !== undefined ? value : '—'),
    },
    {
      title: intl.formatMessage({ id: 'skill.column.hostToolCount' }),
      dataIndex: 'hostToolCount',
      key: 'hostToolCount',
      width: 110,
      render: (value?: number) => (value !== undefined ? value : '—'),
    },
    {
      title: intl.formatMessage({ id: 'skill.column.isActive' }),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (value?: boolean) =>
        value !== false ? (
          <Tag color="success">
            {intl.formatMessage({ id: 'skill.status.active' })}
          </Tag>
        ) : (
          <Tag>{intl.formatMessage({ id: 'skill.status.inactive' })}</Tag>
        ),
    },
    {
      title: intl.formatMessage({ id: 'skill.column.updatedAt' }),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'skill.column.actions' }),
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_value, record) => (
        <AppTableActions>
          <AppTableButton
            onClick={(event) => {
              event.stopPropagation();
              onView(record);
            }}
          >
            {intl.formatMessage({ id: 'skill.action.edit' })}
          </AppTableButton>
          <AppTableButton
            danger
            onClick={(event) => {
              event.stopPropagation();
              onDelete(record);
            }}
          >
            {intl.formatMessage({ id: 'common.delete' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<Skill>
      rowKey="id"
      columns={columns}
      dataSource={list}
      loading={loading}
      pagination={{
        page,
        pageSize,
        total,
        onChange: onPageChange,
      }}
      onRow={(record) => ({
        onClick: () => onView(record),
        style: { cursor: 'pointer' },
      })}
      emptyText={intl.formatMessage({ id: 'skill.empty' })}
    />
  );
};

export default SkillTable;
