import {
  AppTable,
  AppTableActions,
  AppTableBooleanStatusCell,
  AppTableButton,
  AppTableCodeCell,
  AppTableMuted,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { FlowListItem } from '@/types/flow';
import { RightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import type { ColumnsType } from 'antd/es/table';
import styles from '../../Workflow/index.module.scss';

type FlowTableProps = {
  list: FlowListItem[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onRowClick: (id: number) => void;
  onDelete: (record: FlowListItem) => void;
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

const FlowTable: React.FC<FlowTableProps> = ({
  list,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onRowClick,
  onDelete,
}) => {
  const intl = useIntl();

  const columns: ColumnsType<FlowListItem> = [
    {
      title: intl.formatMessage({ id: 'flow.column.name' }),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record) => (
        <AppTablePrimaryCell
          title={name}
          meta={
            <AppTableCodeCell
              value={record.flowKey}
              empty={intl.formatMessage({ id: 'flow.list.noKey' })}
            />
          }
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'flow.column.profile' }),
      dataIndex: 'profile',
      key: 'profile',
      width: 140,
      render: (profile: string) => (
        <span className={`${styles.profilePill} ${profileClassName(profile)}`}>
          {intl.formatMessage({
            id: `workflow.profile.${profile}`,
            defaultMessage: profile,
          })}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'flow.column.version' }),
      dataIndex: 'version',
      key: 'version',
      width: 88,
      render: (version: number) => `v${version}`,
    },
    {
      title: intl.formatMessage({ id: 'flow.column.irNodes' }),
      dataIndex: 'irNodeCount',
      key: 'irNodeCount',
      width: 100,
      render: (count: number) =>
        count > 0 ? count : <AppTableMuted>0</AppTableMuted>,
    },
    {
      title: intl.formatMessage({ id: 'flow.column.refs' }),
      key: 'refs',
      width: 160,
      render: (_, record) => {
        if (record.skillRefCount === 0 && record.pageActionRefCount === 0) {
          return <AppTableMuted>—</AppTableMuted>;
        }
        return (
          <div className={styles.refBadges}>
            {record.skillRefCount > 0 ? (
              <span className={styles.refBadgeSkill}>
                {intl.formatMessage(
                  { id: 'flow.list.refSkill' },
                  { count: record.skillRefCount },
                )}
              </span>
            ) : null}
            {record.pageActionRefCount > 0 ? (
              <span className={styles.refBadgePage}>
                {intl.formatMessage(
                  { id: 'flow.list.refPage' },
                  { count: record.pageActionRefCount },
                )}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      title: intl.formatMessage({ id: 'flow.column.isActive' }),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (active: boolean) => (
        <AppTableBooleanStatusCell
          value={active}
          activeLabel={intl.formatMessage({ id: 'common.active' })}
          inactiveLabel={intl.formatMessage({ id: 'common.inactive' })}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'common.actions' }),
      key: 'actions',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <AppTableActions>
          <AppTableButton
            variant="danger"
            onClick={(event) => {
              event?.stopPropagation?.();
              onDelete(record);
            }}
          >
            {intl.formatMessage({ id: 'common.delete' })}
          </AppTableButton>
        </AppTableActions>
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
    <AppTable<FlowListItem>
      className={styles.workflowTable}
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={list}
      clickableRows
      onRowClick={(record) => onRowClick(record.id)}
      pagination={{
        page,
        pageSize,
        total,
        onChange: onPageChange,
      }}
    />
  );
};

export default FlowTable;
