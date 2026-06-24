import { AppListSearchInput } from '@/components/AppQueryPanel';
import {
  AppTable,
  AppTableCodeCell,
  AppTableMethodCell,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { Tool } from '@/types/tool';
import { useIntl } from '@umijs/max';
import { Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import styles from '../index.module.scss';

type AgentBindToolsModalProps = {
  open: boolean;
  loading?: boolean;
  submitting?: boolean;
  tools: Tool[];
  boundToolIds: number[];
  page: number;
  pageSize: number;
  total: number;
  keyword: string;
  onKeywordChange: (value: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (toolIds: number[]) => void;
};

const AgentBindToolsModal: React.FC<AgentBindToolsModalProps> = ({
  open,
  loading = false,
  submitting = false,
  tools,
  boundToolIds,
  page,
  pageSize,
  total,
  keyword,
  onKeywordChange,
  onPageChange,
  onOpenChange,
  onSubmit,
}) => {
  const intl = useIntl();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const boundIdSet = useMemo(() => new Set(boundToolIds), [boundToolIds]);

  const selectableTools = useMemo(
    () => tools.filter((tool) => !boundIdSet.has(tool.id)),
    [boundIdSet, tools],
  );

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
    }
  }, [open]);

  const columns: ColumnsType<Tool> = [
    {
      title: intl.formatMessage({ id: 'agent.tools.column.name' }),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record) => (
        <AppTablePrimaryCell title={name} meta={`#${record.id}`} />
      ),
    },
    {
      title: intl.formatMessage({ id: 'agent.tools.column.method' }),
      dataIndex: 'method',
      key: 'method',
      width: 92,
      align: 'center',
      render: (method: string) => <AppTableMethodCell method={method} />,
    },
    {
      title: intl.formatMessage({ id: 'agent.tools.column.path' }),
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      render: (path: string) => <AppTableCodeCell value={path} />,
    },
    {
      title: intl.formatMessage({ id: 'agent.tools.column.description' }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => description || '—',
    },
  ];

  const handleOk = () => {
    if (selectedIds.length === 0) {
      return;
    }
    onSubmit(selectedIds);
  };

  return (
    <Modal
      className="app-modal"
      title={intl.formatMessage({ id: 'agent.tools.bindTitle' })}
      open={open}
      width={800}
      destroyOnClose
      okText={intl.formatMessage({ id: 'agent.tools.bindConfirm' })}
      cancelText={intl.formatMessage({ id: 'common.cancel' })}
      okButtonProps={{
        disabled: selectedIds.length === 0,
        loading: submitting,
      }}
      onCancel={() => onOpenChange(false)}
      onOk={handleOk}
    >
      <p className={styles.agentBindModalHint}>
        {intl.formatMessage({ id: 'agent.tools.bindHint' })}
      </p>
      <div className={styles.agentBindModalToolbar}>
        <AppListSearchInput
          placeholder={intl.formatMessage({ id: 'tool.search' })}
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
        />
      </div>
      <AppTable<Tool>
        rowKey="id"
        columns={columns}
        dataSource={selectableTools}
        loading={loading}
        scroll={{ x: 640, y: 360 }}
        emptyText={intl.formatMessage({ id: 'agent.tools.bindEmpty' })}
        pagination={{
          page,
          pageSize,
          total,
          pageSizeOptions: [12, 24, 48, 100],
          onChange: onPageChange,
        }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys.map((key) => Number(key))),
        }}
      />
    </Modal>
  );
};

export default AgentBindToolsModal;
