import {
  AppQueryPanel,
  AppQuerySelect,
} from '@/components/AppQueryPanel';
import { WORKFLOW_PROFILE_OPTIONS } from '@/pages/Workflow/workflowShared';
import {
  countActiveFlowFilters,
  type FlowFilterFormValues,
  type FlowFilterValues,
} from '../flowFilter';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useMemo } from 'react';

type FlowFilterProps = {
  form: ReturnType<typeof Form.useForm<FlowFilterFormValues>>[0];
  appliedFilters: FlowFilterValues;
  loading?: boolean;
  onSearch: (values: FlowFilterFormValues) => void;
  onReset: () => void;
};

const FlowFilter: React.FC<FlowFilterProps> = ({
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

  const activeOptions = useMemo(
    () => [
      ...anyOption,
      {
        value: 'true',
        label: intl.formatMessage({ id: 'common.active' }),
      },
      {
        value: 'false',
        label: intl.formatMessage({ id: 'common.inactive' }),
      },
    ],
    [anyOption, intl],
  );

  const profileOptions = useMemo(
    () => [
      ...anyOption,
      ...WORKFLOW_PROFILE_OPTIONS.map((value) => ({
        value,
        label: intl.formatMessage({ id: `workflow.profile.${value}` }),
      })),
    ],
    [anyOption, intl],
  );

  return (
    <AppQueryPanel<FlowFilterFormValues>
      form={form}
      appliedFilters={appliedFilters}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      showProjectScope
      keywordPlaceholder={intl.formatMessage({
        id: 'flow.filter.keywordPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActiveFlowFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item
            name="profile"
            label={intl.formatMessage({ id: 'flow.filter.profile' })}
          >
            <AppQuerySelect
              options={profileOptions}
              placeholder={intl.formatMessage({
                id: 'flow.filter.profilePlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="isActive"
            label={intl.formatMessage({ id: 'flow.filter.isActive' })}
          >
            <AppQuerySelect
              options={activeOptions}
              placeholder={intl.formatMessage({
                id: 'appQueryPanel.selectPlaceholder',
              })}
            />
          </Form.Item>
        </AppQueryPanel.Grid>
      }
    />
  );
};

export default FlowFilter;
