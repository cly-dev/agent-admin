import {
  AppTable,
  AppTableBooleanStatusCell,
  AppTableCodeCell,
  AppTableMuted,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { WorkflowListItem, WorkflowProfile } from '@/types/workflow';
import { RightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import type { ColumnsType } from 'antd/es/table';
import styles from '../index.module.scss';

type WorkflowTableProps = {
  list: WorkflowListItem[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onRowClick: (id: number) => void;
};

function profileClassName(profile: string): string {
  if (profile === 'chat_skill') {
    return styles.profilePill_chat_skill;
  }
  if (profile === 'page_action') {
    return styles.profilePill_page_action;
  }
  return styles.profilePill_shared;
}

function NodeRail({ count }: { count: number }) {
  const visible = Math.min(Math.max(count, 0), 6);
  if (count <= 0) {
    return <AppTableMuted>0</AppTableMuted>;
  }

  return (
    <div className={styles.nodeRail} title={`${count}`}>
      <span className={styles.nodeRailTrack} aria-hidden>
        {Array.from({ length: visible }).map((_, index) => (
          <span
            key={index}
            className={`${styles.nodeRailDot} ${index === visible - 1 ? styles.nodeRailDotLast : ''}`.trim()}
          />
        ))}
      </span>
      <span className={styles.nodeRailCount}>{count}</span>
    </div>
  );
}

function RefBadges({
  skillRefCount,
  pageActionRefCount,
}: {
  skillRefCount: number;
  pageActionRefCount: number;
}) {
  const intl = useIntl();

  if (skillRefCount === 0 && pageActionRefCount === 0) {
    return <AppTableMuted>—</AppTableMuted>;
  }

  return (
    <div className={styles.refBadges}>
      {skillRefCount > 0 ? (
        <span className={styles.refBadgeSkill}>
          {intl.formatMessage(
            { id: 'workflow.list.refSkill' },
            { count: skillRefCount },
          )}
        </span>
      ) : null}
      {pageActionRefCount > 0 ? (
        <span className={styles.refBadgePage}>
          {intl.formatMessage(
            { id: 'workflow.list.refPage' },
            { count: pageActionRefCount },
          )}
        </span>
      ) : null}
    </div>
  );
}

const WorkflowTable: React.FC<WorkflowTableProps> = ({
  list,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onRowClick,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<WorkflowListItem> = [
    {
      title: intl.formatMessage({ id: 'workflow.column.name' }),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record) => (
        <AppTablePrimaryCell
          title={name}
          meta={
            <AppTableCodeCell
              value={record.workflowKey}
              empty={intl.formatMessage({ id: 'workflow.list.noKey' })}
            />
          }
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'workflow.column.profile' }),
      dataIndex: 'profile',
      key: 'profile',
      width: 132,
      render: (value: WorkflowProfile | string) => (
        <span className={`${styles.profilePill} ${profileClassName(value)}`}>
          {intl.formatMessage({
            id: `workflow.profile.${value}`,
            defaultMessage: value,
          })}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'workflow.column.version' }),
      dataIndex: 'version',
      key: 'version',
      width: 72,
      align: 'center',
      render: (value: number, record) => (
        <span
          className={styles.versionBadge}
          title={
            record.revisionCount
              ? intl.formatMessage(
                  { id: 'workflow.list.revisionCount' },
                  { count: record.revisionCount },
                )
              : undefined
          }
        >
          v{value}
          {record.revisionCount && record.revisionCount > 1
            ? ` · ${record.revisionCount}`
            : ''}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'workflow.column.nodeCount' }),
      dataIndex: 'nodeCount',
      key: 'nodeCount',
      width: 120,
      render: (value: number) => <NodeRail count={value} />,
    },
    {
      title: intl.formatMessage({ id: 'workflow.column.refs' }),
      key: 'refs',
      width: 160,
      render: (_, record) => (
        <RefBadges
          skillRefCount={record.skillRefCount}
          pageActionRefCount={record.pageActionRefCount}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'workflow.column.isActive' }),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 96,
      render: (value: boolean) => (
        <AppTableBooleanStatusCell
          value={value}
          activeLabel={intl.formatMessage({ id: 'common.active' })}
          inactiveLabel={intl.formatMessage({ id: 'common.inactive' })}
        />
      ),
    },
    {
      key: 'open',
      width: 44,
      align: 'center',
      render: () => (
        <span className={styles.rowOpenHint} aria-hidden>
          <RightOutlined />
        </span>
      ),
    },
  ];

  return (
    <AppTable<WorkflowListItem>
      className={styles.workflowTable}
      rowKey="id"
      loading={loading}
      dataSource={list}
      clickableRows
      onRowClick={(record) => onRowClick(record.id)}
      pagination={{
        page,
        pageSize,
        total,
        onChange: onPageChange,
      }}
      columns={columns}
    />
  );
};

export default WorkflowTable;
