import {
  AppTable,
  AppTableActions,
  AppTableButton,
  AppTableCodeCell,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { PageAgentLlmProxyAuditListItem } from '@/types/page-agent-llm-proxy-audit';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PAGE_AGENT_RUN_STATUS_COLORS,
  formatAuditDateTime,
  formatAuditDuration,
  formatAuditUser,
  formatNullableNumber,
} from '../pageAgentRunDisplay';

type PageAgentRunTableProps = {
  list: PageAgentLlmProxyAuditListItem[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (record: PageAgentLlmProxyAuditListItem) => void;
};

const PageAgentRunTable: React.FC<PageAgentRunTableProps> = ({
  list,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<PageAgentLlmProxyAuditListItem> = [
    {
      title: intl.formatMessage({ id: 'pageAgentRun.column.createdAt' }),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 168,
      render: (value: string) => formatAuditDateTime(value),
    },
    {
      title: intl.formatMessage({ id: 'pageAgentRun.column.model' }),
      key: 'model',
      width: 240,
      ellipsis: true,
      render: (_: unknown, record) => (
        <AppTablePrimaryCell
          title={record.providerModel || record.requestedModel || '—'}
          meta={record.provider || `#${record.id}`}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'pageAgentRun.column.user' }),
      key: 'user',
      width: 180,
      ellipsis: true,
      render: (_: unknown, record) =>
        formatAuditUser(record.username, record.userEmail, record.userId),
    },
    {
      title: intl.formatMessage({ id: 'pageAgentRun.column.status' }),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value: string) => (
        <Tag color={PAGE_AGENT_RUN_STATUS_COLORS[value] ?? 'default'}>
          {intl.formatMessage({
            id: `pageAgentRun.status.${value}`,
            defaultMessage: value,
          })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: 'pageAgentRun.column.upstreamStatus' }),
      dataIndex: 'upstreamStatus',
      key: 'upstreamStatus',
      width: 120,
      render: (value: number | null, record) =>
        value ? (
          <Tag color={record.status === 'failed' ? 'error' : 'default'}>
            {value}
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: intl.formatMessage({ id: 'pageAgentRun.column.durationMs' }),
      dataIndex: 'durationMs',
      key: 'durationMs',
      width: 110,
      render: (value: number | null) => formatAuditDuration(value),
    },
    {
      title: intl.formatMessage({ id: 'pageAgentRun.column.tokens' }),
      key: 'tokens',
      width: 140,
      render: (_: unknown, record) =>
        `${formatNullableNumber(record.totalTokens)} (${formatNullableNumber(
          record.promptTokens,
        )}/${formatNullableNumber(record.completionTokens)})`,
    },
    {
      title: intl.formatMessage({ id: 'pageAgentRun.column.modelConfigId' }),
      dataIndex: 'modelConfigId',
      key: 'modelConfigId',
      width: 120,
      render: (value: number | null) =>
        value ? <AppTableCodeCell value={`#${value}`} /> : '—',
    },
    {
      title: intl.formatMessage({ id: 'pageAgentRun.column.finishedAt' }),
      dataIndex: 'finishedAt',
      key: 'finishedAt',
      width: 168,
      render: (value: string | null) => formatAuditDateTime(value),
    },
    {
      title: intl.formatMessage({ id: 'pageAgentRun.column.actions' }),
      key: 'actions',
      align: 'right',
      width: 100,
      render: (_: unknown, record) => (
        <AppTableActions>
          <AppTableButton variant="primary" onClick={() => onView(record)}>
            {intl.formatMessage({ id: 'common.view' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<PageAgentLlmProxyAuditListItem>
      rowKey="id"
      columns={columns}
      dataSource={list}
      loading={loading}
      scroll={{ x: 1400 }}
      clickableRows
      onRowClick={(record) => onView(record)}
      pagination={{
        page,
        pageSize,
        total,
        onChange: onPageChange,
      }}
      emptyText={intl.formatMessage({ id: 'pageAgentRun.empty' })}
    />
  );
};

export default PageAgentRunTable;
