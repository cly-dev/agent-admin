import {
  AppTable,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { PageActionRunListItem, PageActionRunStatus } from '@/types/page-action-run';
import { Link, useIntl } from '@umijs/max';
import { Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PAGE_ACTION_RUN_STATUS_COLORS,
  formatDurationMs,
  formatDwellDuration,
  formatPageActionRunDateTime,
  formatPageActionRunFinishedAt,
  formatUserLabel,
  isPageActionRunPending,
  isWorkflowTriggerPermissionDenied,
} from '../pageActionRunDisplay';

type PageActionRunTableProps = {
  list: PageActionRunListItem[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  detailPath: (id: number) => string;
};

const PageActionRunTable: React.FC<PageActionRunTableProps> = ({
  list,
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  detailPath,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<PageActionRunListItem> = [
    {
      title: intl.formatMessage({ id: 'pageActionRun.column.createdAt' }),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 168,
      render: (value: string) => formatPageActionRunDateTime(value),
    },
    {
      title: intl.formatMessage({ id: 'pageActionRun.column.action' }),
      key: 'action',
      width: 240,
      ellipsis: true,
      render: (_: unknown, record) => (
        <AppTablePrimaryCell
          title={record.pageActionName || record.actionKey}
          meta={record.actionKey}
          href={detailPath(record.id)}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'pageActionRun.column.user' }),
      key: 'user',
      width: 160,
      ellipsis: true,
      render: (_: unknown, record) =>
        formatUserLabel(record.username, record.userEmail, record.userId),
    },
    {
      title: intl.formatMessage({ id: 'pageActionRun.column.status' }),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value: string) => {
        const status = value as PageActionRunStatus;
        const color = PAGE_ACTION_RUN_STATUS_COLORS[status] ?? 'default';
        return (
          <Tag color={color}>
            {intl.formatMessage({
              id: `pageActionRun.status.${status}`,
              defaultMessage: value,
            })}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'pageActionRun.column.finishedAt' }),
      dataIndex: 'finishedAt',
      key: 'finishedAt',
      width: 168,
      render: (value: string | null, record) =>
        formatPageActionRunFinishedAt(record.status, value),
    },
    {
      title: intl.formatMessage({ id: 'pageActionRun.column.dwellTime' }),
      key: 'dwellTime',
      width: 100,
      render: (_: unknown, record) => {
        const dwell = formatDwellDuration(
          record.createdAt,
          record.finishedAt,
          record.status,
        );
        if (record.status === 'awaiting_approval') {
          return <Tag color="warning">{dwell}</Tag>;
        }
        return dwell;
      },
    },
    {
      title: intl.formatMessage({ id: 'pageActionRun.column.durationMs' }),
      dataIndex: 'durationMs',
      key: 'durationMs',
      width: 100,
      render: (value: number | null, record) =>
        isPageActionRunPending(record.status) ? '—' : formatDurationMs(value),
    },
    {
      title: intl.formatMessage({ id: 'pageActionRun.column.errorCode' }),
      dataIndex: 'errorCode',
      key: 'errorCode',
      width: 140,
      ellipsis: true,
      render: (value: string | null, record) => {
        if (!value) return '—';
        if (isWorkflowTriggerPermissionDenied(record)) {
          return (
            <Tooltip
              title={intl.formatMessage({
                id: 'pageActionRun.permissionDenied.tooltip',
              })}
            >
              <Link to="/user/role">{value}</Link>
            </Tooltip>
          );
        }
        return value;
      },
    },
    {
      title: intl.formatMessage({ id: 'pageActionRun.column.dslOutcome' }),
      dataIndex: 'dslOutcome',
      key: 'dslOutcome',
      width: 120,
      render: (value: string | null) =>
        value ? (
          <Tag>
            {intl.formatMessage({
              id: `pageActionRun.dslOutcome.${value}`,
              defaultMessage: value,
            })}
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: intl.formatMessage({ id: 'pageActionRun.column.stepCount' }),
      dataIndex: 'stepCount',
      key: 'stepCount',
      width: 90,
      render: (value: number) => value ?? 0,
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => `#${id}`,
    },
  ];

  return (
    <AppTable<PageActionRunListItem>
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
      emptyText={intl.formatMessage({ id: 'pageActionRun.empty' })}
    />
  );
};

export default PageActionRunTable;
