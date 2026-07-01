import {
  AppQueryPanel,
  AppQuerySelect,
} from '@/components/AppQueryPanel';
import { WORKFLOW_PROFILE_OPTIONS } from '../workflowShared';
import {
  countActiveWorkflowFilters,
  type WorkflowFilterFormValues,
  type WorkflowFilterValues,
} from '../workflowFilter';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useMemo } from 'react';

type WorkflowFilterProps = {
  form: ReturnType<typeof Form.useForm<WorkflowFilterFormValues>>[0];
  appliedFilters: WorkflowFilterValues;
  loading?: boolean;
  onSearch: (values: WorkflowFilterFormValues) => void;
  onReset: () => void;
};

const WorkflowFilter: React.FC<WorkflowFilterProps> = ({
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
    <AppQueryPanel<WorkflowFilterFormValues>
      form={form}
      appliedFilters={appliedFilters}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      showProjectScope
      keywordPlaceholder={intl.formatMessage({
        id: 'workflow.filter.keywordPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActiveWorkflowFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item
            name="profile"
            label={intl.formatMessage({ id: 'workflow.filter.profile' })}
          >
            <AppQuerySelect
              options={profileOptions}
              placeholder={intl.formatMessage({
                id: 'workflow.filter.profilePlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="isActive"
            label={intl.formatMessage({ id: 'workflow.filter.isActive' })}
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

export default WorkflowFilter;
