import { AppQueryInputNumber, AppQueryPanel } from '@/components/AppQueryPanel';
import { Form } from 'antd';
import { useIntl } from '@umijs/max';
import {
  countActiveUserAppFilters,
  type UserAppFilterFormValues,
  type UserAppFilterValues,
} from '../userAppFilter';

type UserFilterProps = {
  form: ReturnType<typeof Form.useForm<UserAppFilterFormValues>>[0];
  appliedFilters: UserAppFilterValues;
  loading?: boolean;
  onSearch: (values: UserAppFilterFormValues) => void;
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
    <AppQueryPanel<UserAppFilterFormValues>
      form={form}
      appliedFilters={appliedFilters as Record<string, unknown>}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      keywordPlaceholder={intl.formatMessage({ id: 'user.filter.keywordPlaceholder' })}
      keywordClassName="max-w-md"
      countActive={countActiveUserAppFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item name="id" label="ID">
            <AppQueryInputNumber
              min={1}
              placeholder={intl.formatMessage({ id: 'appQueryPanel.numberPlaceholder' })}
            />
          </Form.Item>
          <Form.Item name="userId" label={intl.formatMessage({ id: 'user.column.userId' })}>
            <AppQueryInputNumber
              min={1}
              placeholder={intl.formatMessage({ id: 'appQueryPanel.numberPlaceholder' })}
            />
          </Form.Item>
          <Form.Item name="appId" label={intl.formatMessage({ id: 'user.column.appId' })}>
            <AppQueryInputNumber
              min={1}
              placeholder={intl.formatMessage({ id: 'appQueryPanel.numberPlaceholder' })}
            />
          </Form.Item>
          <Form.Item name="roleId" label={intl.formatMessage({ id: 'user.column.roleId' })}>
            <AppQueryInputNumber
              min={1}
              placeholder={intl.formatMessage({ id: 'appQueryPanel.numberPlaceholder' })}
            />
          </Form.Item>
        </AppQueryPanel.Grid>
      }
    />
  );
};

export default UserFilter;
