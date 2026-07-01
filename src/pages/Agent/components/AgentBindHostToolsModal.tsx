import { AppListSearchInput } from '@/components/AppQueryPanel';
import {
  AppTable,
  AppTableCodeCell,
  AppTableDescription,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import type { HostTool } from '@/types/host-tool';
import { useIntl } from '@umijs/max';
import { Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import styles from '../index.module.scss';

type AgentBindHostToolsModalProps = {
  open: boolean;
  loading?: boolean;
  submitting?: boolean;
  tools: HostTool[];
  boundHostToolIds: number[];
  page: number;
  pageSize: number;
  total: number;
  keyword: string;
  onKeywordChange: (value: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (hostToolIds: number[]) => void;
};

const AgentBindHostToolsModal: React.FC<AgentBindHostToolsModalProps> = ({
  open,
  loading = false,
  submitting = false,
  tools,
  boundHostToolIds,
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

  const boundIdSet = useMemo(
    () => new Set(boundHostToolIds),
    [boundHostToolIds],
  );

  const selectableTools = useMemo(
    () => tools.filter((tool) => !boundIdSet.has(tool.id) && !tool.bound),
    [boundIdSet, tools],
  );

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
    }
  }, [open]);

  const columns: ColumnsType<HostTool> = [
    {
      title: intl.formatMessage({ id: 'agent.hostTools.column.name' }),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record) => (
        <AppTablePrimaryCell title={name} meta={`#${record.id}`} />
      ),
    },
    {
      title: intl.formatMessage({ id: 'agent.hostTools.column.pageScope' }),
      dataIndex: 'pageScope',
      key: 'pageScope',
      width: 140,
      render: (value?: string | null) =>
        value ? (
          <AppTableCodeCell value={value} />
        ) : (
          intl.formatMessage({ id: 'hostTool.pageScope.generic' })
        ),
    },
    {
      title: intl.formatMessage({ id: 'agent.hostTools.column.description' }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => (
        <AppTableDescription>{description || '—'}</AppTableDescription>
      ),
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
      open={open}
      title={intl.formatMessage({ id: 'agent.hostTools.bindModal.title' })}
      okText={intl.formatMessage({ id: 'agent.hostTools.bindModal.submit' })}
      cancelText={intl.formatMessage({ id: 'common.cancel' })}
      width={880}
      confirmLoading={submitting}
      okButtonProps={{ disabled: selectedIds.length === 0 }}
      onCancel={() => onOpenChange(false)}
      onOk={handleOk}
      destroyOnClose
    >
      <div className={styles.agentBindToolsModalToolbar}>
        <AppListSearchInput
          value={keyword}
          placeholder={intl.formatMessage({
            id: 'agent.hostTools.bindModal.search',
          })}
          onChange={(event) => onKeywordChange(event.target.value)}
        />
      </div>
      <AppTable<HostTool>
        rowKey="id"
        columns={columns}
        dataSource={selectableTools}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total,
          onChange: onPageChange,
        }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys.map((key) => Number(key))),
          preserveSelectedRowKeys: true,
          getCheckboxProps: (record) => ({
            disabled: boundIdSet.has(record.id) || record.bound === true,
          }),
        }}
        emptyText={intl.formatMessage({
          id: 'agent.hostTools.bindModal.empty',
        })}
      />
    </Modal>
  );
};

export default AgentBindHostToolsModal;
