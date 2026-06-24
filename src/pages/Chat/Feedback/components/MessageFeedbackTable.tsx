import {
  AppTable,
  AppTableActions,
  AppTableButton,
  AppTableCodeCell,
  AppTableDescription,
  AppTableMuted,
} from '@/components/AppTable';
import type { MessageFeedbackListItem } from '@/types/message-feedback';
import { history, useIntl } from '@umijs/max';
import type { ColumnsType } from 'antd/es/table';
import styles from '../../index.module.scss';

type MessageFeedbackTableProps = {
  list: MessageFeedbackListItem[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  onViewDetail: (id: number) => void;
  sessionDetailPath: (sessionId: string) => string;
};

function formatUserLabel(item: MessageFeedbackListItem): string {
  const { user } = item;
  if (user.username?.trim()) {
    return user.employeeId?.trim()
      ? `${user.username} (${user.employeeId})`
      : user.username;
  }
  if (user.email?.trim()) {
    return user.email;
  }
  return user.id ? `#${user.id}` : '—';
}

function summarizeReason(item: MessageFeedbackListItem): string {
  const labels = item.reasonTagLabels.filter(Boolean);
  if (labels.length > 0) {
    return labels.join('、');
  }
  if (item.comment?.trim()) {
    return item.comment.trim();
  }
  return '—';
}

const MessageFeedbackTable: React.FC<MessageFeedbackTableProps> = ({
  list,
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onViewDetail,
  sessionDetailPath,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<MessageFeedbackListItem> = [
    {
      title: intl.formatMessage({ id: 'messageFeedback.column.createdAt' }),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => (
        <AppTableCodeCell value={createdAt} empty="—" />
      ),
    },
    {
      title: intl.formatMessage({ id: 'messageFeedback.column.rating' }),
      dataIndex: 'rating',
      key: 'rating',
      width: 96,
      align: 'center',
      render: (rating: MessageFeedbackListItem['rating']) => (
        <span
          className={
            rating === 'up'
              ? styles.feedbackRatingUp
              : styles.feedbackRatingDown
          }
        >
          {rating === 'up'
            ? intl.formatMessage({ id: 'messageFeedback.rating.up' })
            : intl.formatMessage({ id: 'messageFeedback.rating.down' })}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'messageFeedback.column.user' }),
      key: 'user',
      width: 160,
      render: (_, record) => formatUserLabel(record),
    },
    {
      title: intl.formatMessage({ id: 'messageFeedback.column.agent' }),
      dataIndex: 'agentName',
      key: 'agentName',
      width: 140,
      render: (agentName: string | null, record) =>
        agentName?.trim() || (record.agentId ? `#${record.agentId}` : '—'),
    },
    {
      title: intl.formatMessage({ id: 'messageFeedback.column.reason' }),
      key: 'reason',
      width: 200,
      ellipsis: true,
      render: (_, record) => (
        <AppTableDescription>{summarizeReason(record)}</AppTableDescription>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'messageFeedback.column.messagePreview',
      }),
      key: 'messagePreview',
      ellipsis: true,
      render: (_, record) =>
        record.message.contentPreview?.trim() ? (
          <AppTableDescription>
            {record.message.contentPreview}
          </AppTableDescription>
        ) : (
          <AppTableMuted />
        ),
    },
    {
      title: intl.formatMessage({ id: 'messageFeedback.column.actions' }),
      key: 'actions',
      width: 160,
      align: 'right',
      render: (_, record) => (
        <AppTableActions>
          <AppTableButton
            onClick={(event) => {
              event.stopPropagation();
              onViewDetail(record.id);
            }}
          >
            {intl.formatMessage({ id: 'common.view' })}
          </AppTableButton>
          {record.sessionId ? (
            <AppTableButton
              onClick={(event) => {
                event.stopPropagation();
                history.push(sessionDetailPath(record.sessionId));
              }}
            >
              {intl.formatMessage({ id: 'messageFeedback.action.session' })}
            </AppTableButton>
          ) : null}
        </AppTableActions>
      ),
    },
  ];

  return (
    <AppTable<MessageFeedbackListItem>
      rowKey="id"
      columns={columns}
      dataSource={list}
      loading={loading}
      scroll={{ x: 1100 }}
      clickableRows
      emptyText={intl.formatMessage({ id: 'messageFeedback.empty.none' })}
      onRowClick={(record) => onViewDetail(record.id)}
      pagination={
        onPageChange
          ? {
              page,
              pageSize,
              total,
              pageSizeOptions: [20, 50, 100],
              onChange: onPageChange,
            }
          : false
      }
    />
  );
};

export default MessageFeedbackTable;
