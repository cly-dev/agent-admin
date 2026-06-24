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
  countActiveMessageFeedbackFilters,
  type MessageFeedbackFilterFormValues,
  type MessageFeedbackFilterValues,
} from '../messageFeedbackFilter';

type MessageFeedbackFilterProps = {
  form: ReturnType<typeof Form.useForm<MessageFeedbackFilterFormValues>>[0];
  appliedFilters: MessageFeedbackFilterValues;
  loading?: boolean;
  agentOptions: Array<{ value: number; label: string }>;
  agentsLoading?: boolean;
  reasonTagOptions: Array<{ value: string; label: string }>;
  reasonTagsLoading?: boolean;
  onSearch: (values: MessageFeedbackFilterFormValues) => void;
  onReset: () => void;
};

const MessageFeedbackFilter: React.FC<MessageFeedbackFilterProps> = ({
  form,
  appliedFilters,
  loading = false,
  agentOptions,
  agentsLoading = false,
  reasonTagOptions,
  reasonTagsLoading = false,
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

  const ratingOptions = useMemo(
    () => [
      ...anyOption,
      {
        value: 'up',
        label: intl.formatMessage({ id: 'messageFeedback.rating.up' }),
      },
      {
        value: 'down',
        label: intl.formatMessage({ id: 'messageFeedback.rating.down' }),
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
    <AppQueryPanel<MessageFeedbackFilterFormValues>
      form={form}
      appliedFilters={appliedFilters}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      layout="list"
      showProjectScope
      keywordName="commentKeyword"
      keywordPlaceholder={intl.formatMessage({
        id: 'messageFeedback.filter.commentKeywordPlaceholder',
      })}
      keywordClassName="max-w-md"
      countActive={countActiveMessageFeedbackFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item name="id" label="ID">
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="rating"
            label={intl.formatMessage({ id: 'messageFeedback.column.rating' })}
          >
            <AppQuerySelect
              options={ratingOptions}
              placeholder={selectPlaceholder}
            />
          </Form.Item>
          <Form.Item
            name="agentId"
            label={intl.formatMessage({ id: 'messageFeedback.column.agent' })}
          >
            <AppQuerySelect
              allowClear
              loading={agentsLoading}
              placeholder={intl.formatMessage({
                id: 'messageFeedback.filter.agentPlaceholder',
              })}
              options={agentOptions}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="reasonTag"
            label={intl.formatMessage({ id: 'messageFeedback.column.reason' })}
          >
            <AppQuerySelect
              allowClear
              loading={reasonTagsLoading}
              placeholder={intl.formatMessage({
                id: 'messageFeedback.filter.reasonPlaceholder',
              })}
              options={reasonTagOptions}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="userId"
            label={intl.formatMessage({ id: 'messageFeedback.column.user' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="sessionId"
            label={intl.formatMessage({ id: 'messageFeedback.column.session' })}
          >
            <AppQueryInput
              placeholder={intl.formatMessage({
                id: 'messageFeedback.filter.sessionIdPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="messageId"
            label={intl.formatMessage({ id: 'messageFeedback.column.message' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="turnId"
            label={intl.formatMessage({ id: 'messageFeedback.column.turn' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
        </AppQueryPanel.Grid>
      }
    />
  );
};

export default MessageFeedbackFilter;
