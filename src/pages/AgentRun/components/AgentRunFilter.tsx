import {
  AppQueryInput,
  AppQueryInputNumber,
  AppQueryPanel,
  AppQuerySelect,
} from '@/components/AppQueryPanel';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useMemo } from 'react';
import {
  countActiveAgentRunFilters,
  type AgentRunFilterFormValues,
  type AgentRunFilterValues,
} from '../agentRunFilter';

type AgentRunFilterProps = {
  form: ReturnType<typeof Form.useForm<AgentRunFilterFormValues>>[0];
  appliedFilters: AgentRunFilterValues;
  loading?: boolean;
  onSearch: (values: AgentRunFilterFormValues) => void;
  onReset: () => void;
};

const ROLES = ['primary', 'router', 'worker', 'reviewer'] as const;
const STATUSES = ['running', 'success', 'failed'] as const;

const AgentRunFilter: React.FC<AgentRunFilterProps> = ({
  form,
  appliedFilters,
  loading = false,
  onSearch,
  onReset,
}) => {
  const intl = useIntl();

  const anyOption = useMemo(
    () => [
      { value: '', label: intl.formatMessage({ id: 'appQueryPanel.any' }) },
    ],
    [intl],
  );

  const roleOptions = useMemo(
    () => [
      ...anyOption,
      ...ROLES.map((role) => ({ value: role, label: role })),
    ],
    [anyOption],
  );

  const statusOptions = useMemo(
    () => [
      ...anyOption,
      ...STATUSES.map((status) => ({ value: status, label: status })),
    ],
    [anyOption],
  );

  const selectPlaceholder = intl.formatMessage({
    id: 'appQueryPanel.selectPlaceholder',
  });
  const numberPlaceholder = intl.formatMessage({
    id: 'appQueryPanel.numberPlaceholder',
  });

  return (
    <AppQueryPanel<AgentRunFilterFormValues>
      form={form}
      appliedFilters={appliedFilters}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      showProjectScope
      keywordPlaceholder={intl.formatMessage({
        id: 'agentRun.filter.keywordPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActiveAgentRunFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item name="id" label="ID">
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="turnId"
            label={intl.formatMessage({ id: 'agentRun.filter.turnId' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="agentId"
            label={intl.formatMessage({ id: 'agentRun.column.agentId' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="sessionId"
            label={intl.formatMessage({ id: 'agentRun.column.sessionId' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'agentRun.filter.sessionIdPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="userId"
            label={intl.formatMessage({ id: 'agentRun.filter.userId' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="role"
            label={intl.formatMessage({ id: 'agentRun.column.role' })}
          >
            <AppQuerySelect
              options={roleOptions}
              placeholder={selectPlaceholder}
            />
          </Form.Item>
          <Form.Item
            name="status"
            label={intl.formatMessage({ id: 'agentRun.column.status' })}
          >
            <AppQuerySelect
              options={statusOptions}
              placeholder={selectPlaceholder}
            />
          </Form.Item>
          <Form.Item
            name="input"
            label={intl.formatMessage({ id: 'agentRun.filter.input' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'agentRun.filter.inputPlaceholder',
              })}
            />
          </Form.Item>
        </AppQueryPanel.Grid>
      }
    />
  );
};

export default AgentRunFilter;
