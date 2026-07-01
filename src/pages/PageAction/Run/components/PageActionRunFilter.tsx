import {
  AppQueryInput,
  AppQueryPanel,
  AppQuerySelect,
} from '@/components/AppQueryPanel';
import type { PageActionRunFilterFormValues } from '../pageActionRunFilter';
import { PAGE_ACTION_RUN_FILTER_STATUSES } from '../pageActionRunDisplay';
import { useIntl } from '@umijs/max';
import { Form, InputNumber } from 'antd';
import { useMemo } from 'react';
import {
  countActivePageActionRunFilters,
  type PageActionRunFilterValues,
} from '../pageActionRunFilter';

type PageActionRunFilterProps = {
  form: ReturnType<typeof Form.useForm<PageActionRunFilterFormValues>>[0];
  appliedFilters: PageActionRunFilterValues;
  loading?: boolean;
  onSearch: (values: PageActionRunFilterFormValues) => void;
  onReset: () => void;
};

const PageActionRunFilter: React.FC<PageActionRunFilterProps> = ({
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

  const statusOptions = useMemo(
    () => [
      ...anyOption,
      ...PAGE_ACTION_RUN_FILTER_STATUSES.map((value) => ({
        value,
        label: intl.formatMessage({ id: `pageActionRun.status.${value}` }),
      })),
    ],
    [anyOption, intl],
  );

  return (
    <AppQueryPanel<PageActionRunFilterFormValues>
      form={form}
      appliedFilters={appliedFilters}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      showProjectScope
      keywordName="actionKey"
      keywordPlaceholder={intl.formatMessage({
        id: 'pageActionRun.filter.actionKeyPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActivePageActionRunFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item
            name="status"
            label={intl.formatMessage({ id: 'pageActionRun.column.status' })}
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
            label={intl.formatMessage({ id: 'pageActionRun.column.user' })}
          >
            <InputNumber className="app-input w-full" min={1} precision={0} />
          </Form.Item>
          <Form.Item
            name="clientActionId"
            label={intl.formatMessage({ id: 'pageActionRun.column.clientActionId' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'pageActionRun.filter.clientActionIdPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="pageActionId"
            label={intl.formatMessage({ id: 'pageActionRun.column.pageActionId' })}
          >
            <InputNumber className="app-input w-full" min={1} precision={0} />
          </Form.Item>
        </AppQueryPanel.Grid>
      }
    />
  );
};

export default PageActionRunFilter;
