import {
  AppTable,
  AppTableActions,
  AppTableButton,
} from '@/components/AppTable';
import type { PromptTemplateVersion } from '@/types/prompt-template';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

type PromptTemplateTableProps = {
  list: PromptTemplateVersion[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  publishSubmittingId?: number | null;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (record: PromptTemplateVersion) => void;
  onEdit: (record: PromptTemplateVersion) => void;
  onDelete: (record: PromptTemplateVersion) => void;
  onPublish: (record: PromptTemplateVersion) => void;
};

const PromptTemplateTable: React.FC<PromptTemplateTableProps> = ({
  list,
  loading = false,
  page,
  pageSize,
  total,
  publishSubmittingId = null,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onPublish,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<PromptTemplateVersion> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: intl.formatMessage({ id: 'promptTemplate.column.key' }),
      dataIndex: 'key',
      key: 'key',
      width: 200,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({ id: 'promptTemplate.column.title' }),
      dataIndex: 'title',
      key: 'title',
      width: 160,
      ellipsis: true,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'promptTemplate.column.locale' }),
      dataIndex: 'locale',
      key: 'locale',
      width: 100,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'promptTemplate.column.category' }),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'promptTemplate.column.appClientId' }),
      dataIndex: 'appClientId',
      key: 'appClientId',
      width: 100,
      render: (value?: number | null) =>
        value
          ? `#${value}`
          : intl.formatMessage({ id: 'promptTemplate.scope.global' }),
    },
    {
      title: intl.formatMessage({ id: 'promptTemplate.column.agentId' }),
      dataIndex: 'agentId',
      key: 'agentId',
      width: 100,
      render: (value?: number | null) =>
        value
          ? `#${value}`
          : intl.formatMessage({ id: 'promptTemplate.scope.global' }),
    },
    {
      title: intl.formatMessage({ id: 'promptTemplate.column.version' }),
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (value?: number) => (value !== undefined ? `v${value}` : '—'),
    },
    {
      title: intl.formatMessage({ id: 'promptTemplate.column.isActive' }),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (value?: boolean) =>
        value ? (
          <Tag color="success">
            {intl.formatMessage({ id: 'promptTemplate.status.active' })}
          </Tag>
        ) : (
          <Tag>
            {intl.formatMessage({ id: 'promptTemplate.status.inactive' })}
          </Tag>
        ),
    },
    {
      title: intl.formatMessage({ id: 'promptTemplate.column.updatedAt' }),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'promptTemplate.column.actions' }),
      key: 'actions',
      align: 'right',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <AppTableActions>
          <AppTableButton variant="neutral" onClick={() => onView(record)}>
            {intl.formatMessage({ id: 'common.view' })}
          </AppTableButton>
          <AppTableButton variant="edit" onClick={() => onEdit(record)}>
            {intl.formatMessage({ id: 'common.edit' })}
          </AppTableButton>
          {!record.isActive ? (
            <>
              <AppTableButton
                variant="primary"
                disabled={publishSubmittingId === record.id}
                onClick={() => onPublish(record)}
              >
                {intl.formatMessage({ id: 'promptTemplate.action.publish' })}
              </AppTableButton>
              <AppTableButton variant="danger" onClick={() => onDelete(record)}>
                {intl.formatMessage({ id: 'common.delete' })}
              </AppTableButton>
            </>
          ) : null}
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<PromptTemplateVersion>
      rowKey="id"
      columns={columns}
      dataSource={list}
      loading={loading}
      scroll={{ x: 1200 }}
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

export default PromptTemplateTable;
