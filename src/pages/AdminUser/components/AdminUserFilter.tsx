import { AppQueryPanel, AppQuerySelect } from '@/components/AppQueryPanel';
import type { AdminRole } from '@/types/admin-user';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import {
  countActiveAdminUserFilters,
  type AdminUserFilterFormValues,
  type AdminUserFilterValues,
} from '../adminUserFilter';

type AdminUserFilterProps = {
  form: ReturnType<typeof Form.useForm<AdminUserFilterFormValues>>[0];
  appliedFilters: AdminUserFilterValues;
  loading?: boolean;
  onSearch: (values: AdminUserFilterFormValues) => void;
  onReset: () => void;
};

const ROLE_OPTIONS: AdminRole[] = ['SUPER_ADMIN', 'OPERATOR', 'VIEWER'];

const AdminUserFilter: React.FC<AdminUserFilterProps> = ({
  form,
  appliedFilters,
  loading = false,
  onSearch,
  onReset,
}) => {
  const intl = useIntl();

  return (
    <AppQueryPanel<AdminUserFilterFormValues>
      form={form}
      appliedFilters={appliedFilters as Record<string, unknown>}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      keywordPlaceholder={intl.formatMessage({
        id: 'adminUser.filter.keywordPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActiveAdminUserFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item
            name="role"
            label={intl.formatMessage({ id: 'adminUser.column.role' })}
          >
            <AppQuerySelect
              allowClear
              placeholder={intl.formatMessage({
                id: 'adminUser.filter.rolePlaceholder',
              })}
              options={ROLE_OPTIONS.map((role) => ({
                value: role,
                label: intl.formatMessage({ id: `adminUser.role.${role}` }),
              }))}
            />
          </Form.Item>
          <Form.Item
            name="isActive"
            label={intl.formatMessage({ id: 'adminUser.column.status' })}
          >
            <AppQuerySelect
              allowClear
              placeholder={intl.formatMessage({
                id: 'adminUser.filter.statusPlaceholder',
              })}
              options={[
                {
                  value: true,
                  label: intl.formatMessage({ id: 'adminUser.status.active' }),
                },
                {
                  value: false,
                  label: intl.formatMessage({
                    id: 'adminUser.status.inactive',
                  }),
                },
              ]}
            />
          </Form.Item>
        </AppQueryPanel.Grid>
      }
    />
  );
};

export default AdminUserFilter;
