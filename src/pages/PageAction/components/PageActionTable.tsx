import {
  AppTable,
  AppTableActions,
  AppTableButton,
  AppTableCodeCell,
  AppTableDescription,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { PageAction } from '@/types/page-action';
import { CopyOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { InputNumber, Switch, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type PageActionTableProps = {
  list: PageAction[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  toggleSubmittingId?: number | null;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (record: PageAction) => void;
  onEdit: (record: PageAction) => void;
  onToggleActive: (record: PageAction, nextActive: boolean) => void;
  onSortOrderBlur: (record: PageAction, nextSortOrder: number) => void;
};

const PageActionTable: React.FC<PageActionTableProps> = ({
  list,
  loading = false,
  page,
  pageSize,
  total,
  toggleSubmittingId = null,
  onPageChange,
  onView,
  onEdit,
  onToggleActive,
  onSortOrderBlur,
}) => {
  const intl = useIntl();

  const copyActionKey = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success(intl.formatMessage({ id: 'pageAction.actionKeyCopied' }));
    } catch {
      message.error(intl.formatMessage({ id: 'pageAction.copyFailed' }));
    }
  };

  const columns: ColumnsType<PageAction> = [
    {
      title: intl.formatMessage({ id: 'pageAction.column.actionKey' }),
      dataIndex: 'actionKey',
      key: 'actionKey',
      width: 240,
      ellipsis: true,
      render: (value: string) => (
        <div className="flex min-w-0 items-center gap-2">
          <AppTableCodeCell value={value} />
          <button
            type="button"
            className="shrink-0 text-on-surface/45 hover:text-primary"
            aria-label={intl.formatMessage({ id: 'pageAction.copyActionKey' })}
            onClick={() => void copyActionKey(value)}
          >
            <CopyOutlined />
          </button>
        </div>
      ),
    },
    {
      title: intl.formatMessage({ id: 'pageAction.column.name' }),
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (value: string, record) => (
        <AppTablePrimaryCell title={value} meta={`#${record.id}`} />
      ),
    },
    {
      title: intl.formatMessage({ id: 'pageAction.column.hostToolName' }),
      dataIndex: 'hostToolName',
      key: 'hostToolName',
      width: 160,
      render: (value: string) => <AppTableCodeCell value={value} />,
    },
    {
      title: intl.formatMessage({ id: 'pageAction.column.pageScope' }),
      dataIndex: 'pageScope',
      key: 'pageScope',
      width: 140,
      render: (value: string | null) =>
        value ? (
          <AppTableCodeCell value={value} />
        ) : (
          intl.formatMessage({ id: 'pageAction.pageScope.generic' })
        ),
    },
    {
      title: intl.formatMessage({ id: 'pageAction.column.sortOrder' }),
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 100,
      render: (value: number, record) => (
        <InputNumber
          size="small"
          min={0}
          value={value}
          className="w-full"
          onBlur={(event) => {
            const next = Number((event.target as HTMLInputElement).value);
            onSortOrderBlur(record, next);
          }}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'pageAction.column.isActive' }),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (value: boolean, record) => (
        <Switch
          size="small"
          checked={value}
          loading={toggleSubmittingId === record.id}
          onChange={(checked) => onToggleActive(record, checked)}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'pageAction.column.description' }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value: string | null) => (
        <AppTableDescription>{value || '—'}</AppTableDescription>
      ),
    },
    {
      title: intl.formatMessage({ id: 'pageAction.column.actions' }),
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_: unknown, record) => (
        <AppTableActions>
          <AppTableButton variant="neutral" onClick={() => onView(record)}>
            {intl.formatMessage({ id: 'common.view' })}
          </AppTableButton>
          <AppTableButton variant="edit" onClick={() => onEdit(record)}>
            {intl.formatMessage({ id: 'common.edit' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<PageAction>
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
      emptyText={intl.formatMessage({ id: 'pageAction.empty' })}
    />
  );
};

export default PageActionTable;
