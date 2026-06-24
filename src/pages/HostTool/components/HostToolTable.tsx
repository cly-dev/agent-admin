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

type HostToolTableProps = {
  list: HostTool[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  showPageScope?: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (record: HostTool) => void;
  onDelete: (record: HostTool) => void;
};

function getSourceLabel(
  config: HostTool['config'],
  intl: ReturnType<typeof useIntl>,
): string {
  const source =
    config && typeof config.source === 'string' ? config.source : undefined;
  if (source === 'client_register') {
    return intl.formatMessage({ id: 'hostTool.source.clientRegister' });
  }
  return intl.formatMessage({ id: 'hostTool.source.manual' });
}

const HostToolTable: React.FC<HostToolTableProps> = ({
  list,
  loading = false,
  page,
  pageSize,
  total,
  showPageScope = true,
  onPageChange,
  onEdit,
  onDelete,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<HostTool> = [
    {
      title: intl.formatMessage({ id: 'hostTool.column.name' }),
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (value: string, record) => (
        <AppTablePrimaryCell title={value} meta={`#${record.id}`} />
      ),
    },
    {
      title: intl.formatMessage({ id: 'hostTool.column.definitionKey' }),
      dataIndex: 'definitionKey',
      key: 'definitionKey',
      width: 220,
      ellipsis: true,
      render: (value: string) => <AppTableCodeCell value={value} />,
    },
    ...(showPageScope
      ? [
          {
            title: intl.formatMessage({ id: 'hostTool.column.pageScope' }),
            dataIndex: 'pageScope',
            key: 'pageScope',
            width: 140,
            render: (_: unknown, record: HostTool) =>
              record.pageScope ? (
                <AppTableCodeCell value={record.pageScope} />
              ) : (
                intl.formatMessage({ id: 'hostTool.pageScope.generic' })
              ),
          } as ColumnsType<HostTool>[number],
        ]
      : []),
    {
      title: intl.formatMessage({ id: 'hostTool.column.exposure' }),
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
      title: intl.formatMessage({ id: 'hostTool.column.description' }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value: string) => (
        <AppTableDescription>{value || '—'}</AppTableDescription>
      ),
    },
    {
      title: intl.formatMessage({ id: 'hostTool.column.source' }),
      key: 'source',
      width: 110,
      render: (_: unknown, record) => getSourceLabel(record.config, intl),
    },
    {
      title: intl.formatMessage({ id: 'hostTool.column.isActive' }),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (value?: boolean) => (
        <Tag color={value !== false ? 'success' : 'default'}>
          {intl.formatMessage({
            id:
              value !== false
                ? 'hostTool.status.active'
                : 'hostTool.status.inactive',
          })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'hostTool.column.actions' }),
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_: unknown, record) => (
        <AppTableActions>
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
    <AppTable<HostTool>
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
      emptyText={intl.formatMessage({ id: 'hostTool.empty' })}
    />
  );
};

export default HostToolTable;
