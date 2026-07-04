import { AppQueryPanel, AppQuerySelect } from '@/components/AppQueryPanel';
import { useIntl } from '@umijs/max';
import { Form, InputNumber } from 'antd';
import { useMemo } from 'react';
import { PAGE_AGENT_RUN_STATUSES } from '../pageAgentRunDisplay';
import {
  countActivePageAgentRunFilters,
  type PageAgentRunFilterFormValues,
  type PageAgentRunFilterValues,
} from '../pageAgentRunFilter';

type PageAgentRunFilterProps = {
  form: ReturnType<typeof Form.useForm<PageAgentRunFilterFormValues>>[0];
  appliedFilters: PageAgentRunFilterValues;
  loading?: boolean;
  onSearch: (values: PageAgentRunFilterFormValues) => void;
  onReset: () => void;
};

const PageAgentRunFilter: React.FC<PageAgentRunFilterProps> = ({
  form,
  appliedFilters,
  loading = false,
  onSearch,
  onReset,
}) => {
  const intl = useIntl();

  const statusOptions = useMemo(
    () => [
      { value: '', label: intl.formatMessage({ id: 'appQueryPanel.any' }) },
      ...PAGE_AGENT_RUN_STATUSES.map((value) => ({
        value,
        label: intl.formatMessage({ id: `pageAgentRun.status.${value}` }),
      })),
    ],
    [intl],
  );

  return (
    <AppQueryPanel<PageAgentRunFilterFormValues>
      form={form}
      appliedFilters={appliedFilters as Record<string, unknown>}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      showProjectScope
      countActive={countActivePageAgentRunFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item
            name="status"
            label={intl.formatMessage({ id: 'pageAgentRun.column.status' })}
          >
            <AppQuerySelect
              options={statusOptions}
              placeholder={intl.formatMessage({
                id: 'appQueryPanel.selectPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="userId"
            label={intl.formatMessage({ id: 'pageAgentRun.column.user' })}
          >
            <InputNumber className="app-input w-full" min={1} precision={0} />
          </Form.Item>
          <Form.Item
            name="modelConfigId"
            label={intl.formatMessage({
              id: 'pageAgentRun.column.modelConfigId',
            })}
          >
            <InputNumber className="app-input w-full" min={1} precision={0} />
          </Form.Item>
          <Form.Item
            name="upstreamStatus"
            label={intl.formatMessage({
              id: 'pageAgentRun.column.upstreamStatus',
            })}
          >
            <InputNumber className="app-input w-full" min={100} precision={0} />
          </Form.Item>
        </AppQueryPanel.Grid>
      }
    />
  );
};

export default PageAgentRunFilter;
