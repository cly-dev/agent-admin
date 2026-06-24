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
  countActivePromptTemplateFilters,
  type PromptTemplateFilterFormValues,
  type PromptTemplateFilterValues,
} from '../promptTemplateFilter';

type PromptTemplateFilterProps = {
  form: ReturnType<typeof Form.useForm<PromptTemplateFilterFormValues>>[0];
  appliedFilters: PromptTemplateFilterValues;
  loading?: boolean;
  onSearch: (values: PromptTemplateFilterFormValues) => void;
  onReset: () => void;
};

const PromptTemplateFilter: React.FC<PromptTemplateFilterProps> = ({
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
        label: intl.formatMessage({ id: 'promptTemplate.filter.active' }),
      },
      {
        value: 'false',
        label: intl.formatMessage({ id: 'promptTemplate.filter.inactive' }),
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
    <AppQueryPanel<PromptTemplateFilterFormValues>
      form={form}
      appliedFilters={appliedFilters}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      keywordPlaceholder={intl.formatMessage({
        id: 'promptTemplate.filter.keywordPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActivePromptTemplateFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item
            name="key"
            label={intl.formatMessage({ id: 'promptTemplate.column.key' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'promptTemplate.filter.keyPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="locale"
            label={intl.formatMessage({ id: 'promptTemplate.column.locale' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'promptTemplate.filter.localePlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="appClientId"
            label={intl.formatMessage({
              id: 'promptTemplate.column.appClientId',
            })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="agentId"
            label={intl.formatMessage({ id: 'promptTemplate.column.agentId' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="isActive"
            label={intl.formatMessage({ id: 'promptTemplate.column.isActive' })}
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

export default PromptTemplateFilter;
