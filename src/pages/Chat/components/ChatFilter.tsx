import {
  AppQueryInput,
  AppQueryInputNumber,
  AppQueryPanel,
} from '@/components/AppQueryPanel';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import {
  countActiveChatFilters,
  type ChatFilterFormValues,
  type ChatFilterValues,
} from '../chatFilter';

type ChatFilterProps = {
  form: ReturnType<typeof Form.useForm<ChatFilterFormValues>>[0];
  appliedFilters: ChatFilterValues;
  loading?: boolean;
  onSearch: (values: ChatFilterFormValues) => void;
  onReset: () => void;
};

const ChatFilter: React.FC<ChatFilterProps> = ({
  form,
  appliedFilters,
  loading = false,
  onSearch,
  onReset,
}) => {
  const intl = useIntl();
  const numberPlaceholder = intl.formatMessage({
    id: 'appQueryPanel.numberPlaceholder',
  });

  return (
    <AppQueryPanel<ChatFilterFormValues>
      form={form}
      appliedFilters={appliedFilters}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      showProjectScope
      keywordPlaceholder={intl.formatMessage({
        id: 'chat.filter.keywordPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActiveChatFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item
            name="id"
            label={intl.formatMessage({ id: 'chat.column.id' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'chat.filter.idPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="userId"
            label={intl.formatMessage({ id: 'chat.column.user' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="agentId"
            label={intl.formatMessage({ id: 'chat.column.agent' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="title"
            label={intl.formatMessage({ id: 'chat.column.project' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'chat.filter.titlePlaceholder',
              })}
            />
          </Form.Item>
        </AppQueryPanel.Grid>
      }
    />
  );
};

export default ChatFilter;
