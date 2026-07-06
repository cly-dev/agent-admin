import {
  AppQueryPanel,
  AppQuerySelect,
} from '@/components/AppQueryPanel';
import { usePageScopeOptions } from '@/hooks/usePageScopeOptions';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useMemo } from 'react';
import {
  countActiveHostPageFilters,
  type HostPageFilterFormValues,
  type HostPageFilterValues,
} from '../hostPageFilter';

type HostPageFilterProps = {
  form: ReturnType<typeof Form.useForm<HostPageFilterFormValues>>[0];
  appliedFilters: HostPageFilterValues;
  loading?: boolean;
  onSearch: (values: HostPageFilterFormValues) => void;
  onReset: () => void;
};

const HostPageFilter: React.FC<HostPageFilterProps> = ({
  form,
  appliedFilters,
  loading = false,
  onSearch,
  onReset,
}) => {
  const intl = useIntl();
  const { projectId } = useProjectRoute();
  const { selectOptions: pageScopeOptions, loading: pageScopeLoading } =
    usePageScopeOptions({
      appClientId: projectId,
      activeOnly: false,
    });

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
        label: intl.formatMessage({ id: 'hostPage.status.active' }),
      },
      {
        value: 'false',
        label: intl.formatMessage({ id: 'hostPage.status.inactive' }),
      },
    ],
    [anyOption, intl],
  );
  const selectPlaceholder = intl.formatMessage({
    id: 'appQueryPanel.selectPlaceholder',
  });

  return (
    <AppQueryPanel<HostPageFilterFormValues>
      form={form}
      appliedFilters={appliedFilters}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      showProjectScope
      keywordPlaceholder={intl.formatMessage({
        id: 'hostPage.filter.keywordPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActiveHostPageFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item
            name="scope"
            label={intl.formatMessage({ id: 'hostPage.column.scope' })}
          >
            <AppQuerySelect
              allowClear
              showSearch
              optionFilterProp="label"
              loading={pageScopeLoading}
              disabled={!projectId}
              options={[...anyOption, ...pageScopeOptions]}
              placeholder={intl.formatMessage({
                id: 'pageScope.selectPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="isActive"
            label={intl.formatMessage({ id: 'hostPage.column.isActive' })}
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

export default HostPageFilter;
