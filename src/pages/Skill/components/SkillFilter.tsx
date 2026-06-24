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
  countActiveSkillFilters,
  type SkillFilterFormValues,
  type SkillFilterValues,
} from '../skillFilter';

type SkillFilterProps = {
  form: ReturnType<typeof Form.useForm<SkillFilterFormValues>>[0];
  appliedFilters: SkillFilterValues;
  loading?: boolean;
  projectId?: number;
  agentOptions?: Array<{ value: number; label: string }>;
  agentsLoading?: boolean;
  onSearch: (values: SkillFilterFormValues) => void;
  onReset: () => void;
};

const SkillFilter: React.FC<SkillFilterProps> = ({
  form,
  appliedFilters,
  loading = false,
  projectId = 0,
  agentOptions = [],
  agentsLoading = false,
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
        label: intl.formatMessage({ id: 'skill.filter.active' }),
      },
      {
        value: 'false',
        label: intl.formatMessage({ id: 'skill.filter.inactive' }),
      },
    ],
    [anyOption, intl],
  );

  const selectPlaceholder = intl.formatMessage({
    id: 'appQueryPanel.selectPlaceholder',
  });
  const numberPlaceholder = intl.formatMessage({
    id: 'appQueryPanel.numberPlaceholder',
  });

  return (
    <AppQueryPanel<SkillFilterFormValues>
      form={form}
      appliedFilters={appliedFilters}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      showProjectScope
      keywordPlaceholder={intl.formatMessage({
        id: 'skill.filter.keywordPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActiveSkillFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item name="id" label="ID">
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="name"
            label={intl.formatMessage({ id: 'skill.column.name' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'skill.filter.namePlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="capabilityKey"
            label={intl.formatMessage({ id: 'skill.column.capabilityKey' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'skill.filter.capabilityKeyPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="agentId"
            label={intl.formatMessage({ id: 'skill.column.agent' })}
          >
            <AppQuerySelect
              allowClear
              disabled={!projectId}
              loading={agentsLoading}
              placeholder={intl.formatMessage({
                id: 'skill.filter.agentPlaceholder',
              })}
              options={agentOptions}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="isActive"
            label={intl.formatMessage({ id: 'skill.column.isActive' })}
          >
            <AppQuerySelect
              options={activeOptions}
              placeholder={selectPlaceholder}
            />
          </Form.Item>
        </AppQueryPanel.Grid>
      }
    />
  );
};

export default SkillFilter;
