import {
  AppQueryInput,
  AppQueryPanel,
  AppQuerySelect,
} from '@/components/AppQueryPanel';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useMemo } from 'react';
import {
  countActivePageActionFilters,
  type PageActionFilterFormValues,
  type PageActionFilterValues,
} from '../pageActionFilter';

type PageActionFilterProps = {
  form: ReturnType<typeof Form.useForm<PageActionFilterFormValues>>[0];
  appliedFilters: PageActionFilterValues;
  loading?: boolean;
  onSearch: (values: PageActionFilterFormValues) => void;
  onReset: () => void;
};

const PageActionFilter: React.FC<PageActionFilterProps> = ({
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
        label: intl.formatMessage({ id: 'pageAction.filter.active' }),
      },
      {
        value: 'false',
        label: intl.formatMessage({ id: 'pageAction.filter.inactive' }),
      },
    ],
    [anyOption, intl],
  );

  return (
    <AppQueryPanel<PageActionFilterFormValues>
      form={form}
      appliedFilters={appliedFilters}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      showProjectScope
      keywordPlaceholder={intl.formatMessage({
        id: 'pageAction.filter.keywordPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActivePageActionFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item
            name="pageScope"
            label={intl.formatMessage({ id: 'pageAction.column.pageScope' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'pageAction.filter.pageScopePlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="isActive"
            label={intl.formatMessage({ id: 'pageAction.column.isActive' })}
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

export default PageActionFilter;
