import {
  AppTable,
  AppTableActions,
  AppTableBooleanStatusCell,
  AppTableButton,
  AppTableCodeCell,
  AppTableDescription,
  AppTableIconLink,
  AppTableMethodCell,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { AgentAllowedToolRef } from '@/types/agent';
import { ExportOutlined } from '@ant-design/icons';
import { history, useIntl } from '@umijs/max';
import { Form, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type {
  AgentBoundToolsFilterFormValues,
  AgentBoundToolsFilterValues,
} from '../agentBoundToolsFilter';
import AgentBoundToolsFilter from './AgentBoundToolsFilter';

export type AgentAllowedToolsTableFilterProps = {
  form: ReturnType<typeof Form.useForm<AgentBoundToolsFilterFormValues>>[0];
  appliedFilters: AgentBoundToolsFilterValues;
  loading?: boolean;
  onSearch: (values: AgentBoundToolsFilterFormValues) => void;
  onReset: () => void;
};

type AgentAllowedToolsTableProps = {
  tools: AgentAllowedToolRef[];
  loading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  unbindSubmittingId?: number | null;
  onPageChange?: (page: number, pageSize: number) => void;
  onUnbind?: (toolId: number) => void;
  filter?: AgentAllowedToolsTableFilterProps;
};

function toolDetailPath(toolId: number) {
  return `/tool/detail/${toolId}`;
}

function stopRowClick(event: React.MouseEvent) {
  event.stopPropagation();
}

const AgentAllowedToolsTable: React.FC<AgentAllowedToolsTableProps> = ({
  tools,
  loading = false,
  page = 1,
  pageSize = 20,
  total = 0,
  unbindSubmittingId = null,
  onPageChange,
  onUnbind,
  filter,
}) => {
  const intl = useIntl();

  const activeLabel = intl.formatMessage({ id: 'common.active' });
  const inactiveLabel = intl.formatMessage({ id: 'common.inactive' });
  const noDescription = intl.formatMessage({ id: 'agent.tools.noDescription' });

  const confirmUnbind = (toolId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onUnbind) {
      return;
    }

    Modal.confirm({
      title: intl.formatMessage({ id: 'agent.tools.unbindConfirm' }),
      okText: intl.formatMessage({ id: 'agent.tools.unbind' }),
      cancelText: intl.formatMessage({ id: 'common.cancel' }),
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => onUnbind(toolId),
    });
  };

  const columns: ColumnsType<AgentAllowedToolRef> = [
    {
      title: intl.formatMessage({ id: 'agent.tools.column.name' }),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record) => (
        <AppTablePrimaryCell
          title={name}
          meta={`#${record.toolId}`}
          href={toolDetailPath(record.toolId)}
          onLinkClick={stopRowClick}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'agent.tools.column.definitionKey' }),
      dataIndex: 'definitionKey',
      key: 'definitionKey',
      width: 148,
      ellipsis: true,
      render: (definitionKey?: string) => (
        <AppTableCodeCell value={definitionKey} />
      ),
    },
    {
      title: intl.formatMessage({ id: 'agent.tools.column.method' }),
      dataIndex: 'method',
      key: 'method',
      width: 92,
      align: 'center',
      render: (method?: string) => <AppTableMethodCell method={method} />,
    },
    {
      title: intl.formatMessage({ id: 'agent.tools.column.path' }),
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      render: (path?: string) => <AppTableCodeCell value={path} />,
    },
    {
      title: intl.formatMessage({ id: 'agent.tools.column.description' }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description?: string) => (
        <AppTableDescription>
          {description || noDescription}
        </AppTableDescription>
      ),
    },
    {
      title: intl.formatMessage({ id: 'agent.tools.column.status' }),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 92,
      align: 'center',
      render: (isActive?: boolean) => (
        <AppTableBooleanStatusCell
          value={isActive}
          activeLabel={activeLabel}
          inactiveLabel={inactiveLabel}
        />
      ),
    },
    ...(onUnbind
      ? [
          {
            title: intl.formatMessage({ id: 'agent.tools.column.actions' }),
            key: 'actions',
            width: 108,
            align: 'right' as const,
            render: (_: unknown, record: AgentAllowedToolRef) => (
              <AppTableActions>
                <AppTableIconLink
                  href={toolDetailPath(record.toolId)}
                  title={intl.formatMessage({ id: 'agent.tools.openDetail' })}
                  onClick={stopRowClick}
                >
                  <ExportOutlined />
                </AppTableIconLink>
                <AppTableButton
                  danger
                  disabled={unbindSubmittingId === record.toolId}
                  onClick={(event) => confirmUnbind(record.toolId, event)}
                >
                  {intl.formatMessage({ id: 'agent.tools.unbind' })}
                </AppTableButton>
              </AppTableActions>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      {filter ? (
        <AgentBoundToolsFilter
          form={filter.form}
          appliedFilters={filter.appliedFilters}
          loading={filter.loading ?? loading}
          onSearch={filter.onSearch}
          onReset={filter.onReset}
        />
      ) : null}
      <AppTable<AgentAllowedToolRef>
        rowKey="bindingId"
        columns={columns}
        dataSource={tools}
        loading={loading}
        scroll={{ x: 880 }}
        clickableRows
        emptyText={intl.formatMessage({ id: 'agent.tools.empty' })}
        onRowClick={(record) => {
          history.push(toolDetailPath(record.toolId));
        }}
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
    </>
  );
};

export default AgentAllowedToolsTable;
