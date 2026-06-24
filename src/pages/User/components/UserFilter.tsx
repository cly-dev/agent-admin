import {
  AppQueryInput,
  AppQueryInputNumber,
  AppQueryPanel,
} from '@/components/AppQueryPanel';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import {
  countActiveUserFilters,
  type UserFilterFormValues,
  type UserFilterValues,
} from '../userFilter';

type UserFilterProps = {
  form: ReturnType<typeof Form.useForm<UserFilterFormValues>>[0];
  appliedFilters: UserFilterValues;
  loading?: boolean;
  onSearch: (values: UserFilterFormValues) => void;
  onReset: () => void;
};

const UserFilter: React.FC<UserFilterProps> = ({
  form,
  appliedFilters,
  loading = false,
  onSearch,
  onReset,
}) => {
  const intl = useIntl();

  return (
    <AppQueryPanel<UserFilterFormValues>
      form={form}
      appliedFilters={appliedFilters as Record<string, unknown>}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      keywordPlaceholder={intl.formatMessage({
        id: 'user.filter.keywordPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActiveUserFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item
            name="id"
            label={intl.formatMessage({ id: 'user.column.id' })}
          >
            <AppQueryInputNumber
              min={1}
              placeholder={intl.formatMessage({
                id: 'appQueryPanel.numberPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="email"
            label={intl.formatMessage({ id: 'user.column.email' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'user.filter.emailPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="username"
            label={intl.formatMessage({ id: 'user.column.username' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'user.filter.usernamePlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="employeeId"
            label={intl.formatMessage({ id: 'user.column.employeeId' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'user.filter.employeeIdPlaceholder',
              })}
            />
          </Form.Item>
        </AppQueryPanel.Grid>
      }
    />
  );
};

export default UserFilter;
