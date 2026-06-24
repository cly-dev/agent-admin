import { AppQueryPanel, AppQuerySelect } from '@/components/AppQueryPanel';
import type { HostToolExposure } from '@/types/host-tool';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useMemo } from 'react';
import {
  countActiveHostToolFilters,
  type HostToolFilterFormValues,
  type HostToolFilterValues,
} from '../hostToolFilter';

type HostToolFilterProps = {
  form: ReturnType<typeof Form.useForm<HostToolFilterFormValues>>[0];
  appliedFilters: HostToolFilterValues;
  loading?: boolean;
  onSearch: (values: HostToolFilterFormValues) => void;
  onReset: () => void;
};

const EXPOSURE_OPTIONS: HostToolExposure[] = [
  'CATALOG',
  'ON_COMPLETE',
  'LLM',
  'BOTH',
];

const HostToolFilter: React.FC<HostToolFilterProps> = ({
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
        label: intl.formatMessage({ id: 'hostTool.status.active' }),
      },
      {
        value: 'false',
        label: intl.formatMessage({ id: 'hostTool.status.inactive' }),
      },
    ],
    [anyOption, intl],
  );
  const selectPlaceholder = intl.formatMessage({
    id: 'appQueryPanel.selectPlaceholder',
  });

  return (
    <AppQueryPanel<HostToolFilterFormValues>
      form={form}
      appliedFilters={appliedFilters}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      showProjectScope
      keywordPlaceholder={intl.formatMessage({
        id: 'hostTool.filter.keywordPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActiveHostToolFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item
            name="exposure"
            label={intl.formatMessage({ id: 'hostTool.column.exposure' })}
          >
            <AppQuerySelect
              allowClear
              placeholder={intl.formatMessage({
                id: 'hostTool.filter.exposurePlaceholder',
              })}
              options={EXPOSURE_OPTIONS.map((value) => ({
                value,
                label: intl.formatMessage({ id: `hostTool.exposure.${value}` }),
              }))}
            />
          </Form.Item>
          <Form.Item
            name="isActive"
            label={intl.formatMessage({ id: 'hostTool.column.isActive' })}
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

export default HostToolFilter;
