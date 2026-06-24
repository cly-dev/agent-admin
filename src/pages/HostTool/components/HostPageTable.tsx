import {
  AppTable,
  AppTableActions,
  AppTableButton,
  AppTableCodeCell,
  AppTableDescription,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { HostPage } from '@/types/host-page';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type HostPageTableProps = {
  list: HostPage[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (record: HostPage) => void;
  onEdit: (record: HostPage) => void;
  onDelete: (record: HostPage) => void;
};

const HostPageTable: React.FC<HostPageTableProps> = ({
  list,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<HostPage> = [
    {
      title: intl.formatMessage({ id: 'hostPage.column.label' }),
      dataIndex: 'label',
      key: 'label',
      width: 180,
      render: (value: string, record) => (
        <AppTablePrimaryCell title={value} meta={`#${record.id}`} />
      ),
    },
    {
      title: intl.formatMessage({ id: 'hostPage.column.scope' }),
      dataIndex: 'scope',
      key: 'scope',
      width: 180,
      render: (value: string) => <AppTableCodeCell value={value} />,
    },
    {
      title: intl.formatMessage({ id: 'hostPage.column.routePattern' }),
      dataIndex: 'routePattern',
      key: 'routePattern',
      width: 180,
      ellipsis: true,
      render: (value?: string | null) =>
        value ? <AppTableCodeCell value={value} /> : '—',
    },
    {
      title: intl.formatMessage({ id: 'hostPage.column.description' }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value?: string | null) => (
        <AppTableDescription>{value?.trim() ? value : '—'}</AppTableDescription>
      ),
    },
    {
      title: intl.formatMessage({ id: 'hostPage.column.hostToolCount' }),
      dataIndex: 'hostToolCount',
      key: 'hostToolCount',
      width: 100,
      render: (value?: number) => (typeof value === 'number' ? value : '—'),
    },
    {
      title: intl.formatMessage({ id: 'hostPage.column.isActive' }),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (value?: boolean) => (
        <Tag color={value !== false ? 'success' : 'default'}>
          {intl.formatMessage({
            id:
              value !== false
                ? 'hostPage.status.active'
                : 'hostPage.status.inactive',
          })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'hostPage.column.actions' }),
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_: unknown, record) => (
        <AppTableActions>
          <AppTableButton variant="neutral" onClick={() => onView(record)}>
            {intl.formatMessage({ id: 'common.view' })}
          </AppTableButton>
          <AppTableButton variant="edit" onClick={() => onEdit(record)}>
            {intl.formatMessage({ id: 'common.edit' })}
          </AppTableButton>
          <AppTableButton variant="danger" onClick={() => onDelete(record)}>
            {intl.formatMessage({ id: 'common.delete' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<HostPage>
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
      emptyText={intl.formatMessage({ id: 'hostPage.empty' })}
    />
  );
};

export default HostPageTable;
