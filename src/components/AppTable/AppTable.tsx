import { useIntl } from '@umijs/max';
import { Spin, Table } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import styles from './index.module.scss';
import { shouldIgnoreTableRowClick } from './utils';

export type AppTablePaginationConfig = {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onChange: (page: number, pageSize: number) => void;
};

export type AppTableProps<T extends object> = {
  rowKey: TableProps<T>['rowKey'];
  columns: ColumnsType<T>;
  dataSource: T[];
  loading?: boolean;
  emptyText?: React.ReactNode;
  scroll?: TableProps<T>['scroll'];
  size?: TableProps<T>['size'];
  pagination?: AppTablePaginationConfig | false;
  /** 为 true 且提供 onRowClick 时，整行可点击（自动忽略按钮/链接区域） */
  clickableRows?: boolean;
  onRowClick?: (record: T, event: React.MouseEvent<HTMLElement>) => void;
  rowSelection?: TableProps<T>['rowSelection'];
  className?: string;
};

function AppTable<T extends object>({
  rowKey,
  columns,
  dataSource,
  loading = false,
  emptyText,
  scroll,
  size = 'middle',
  pagination = false,
  clickableRows = false,
  onRowClick,
  rowSelection,
  className,
}: AppTableProps<T>) {
  const intl = useIntl();

  const resolvedEmptyText =
    emptyText ?? intl.formatMessage({ id: 'appTable.empty', defaultMessage: '暂无数据' });

  return (
    <div className={`${styles.shell} ${className ?? ''}`.trim()}>
      <Spin spinning={loading}>
        <Table<T>
          className={styles.table}
          rowKey={rowKey}
          size={size}
          columns={columns}
          dataSource={dataSource}
          scroll={scroll}
          rowSelection={rowSelection}
          onRow={
            onRowClick
              ? (record) => ({
                  className: clickableRows ? 'clickableRow' : undefined,
                  onClick: (event) => {
                    if (shouldIgnoreTableRowClick(event)) {
                      return;
                    }
                    onRowClick(record, event);
                  },
                })
              : undefined
          }
          pagination={
            pagination
              ? {
                  current: pagination.page,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  showSizeChanger: true,
                  pageSizeOptions: (pagination.pageSizeOptions ?? [20, 50, 100]).map(String),
                  className: styles.pagination,
                  showTotal: (count, range) =>
                    intl.formatMessage(
                      { id: 'common.pagination.total' },
                      { start: range[0], end: range[1], total: count },
                    ),
                  onChange: pagination.onChange,
                }
              : false
          }
          locale={{
            emptyText: resolvedEmptyText,
          }}
        />
      </Spin>
    </div>
  );
}

export default AppTable;
