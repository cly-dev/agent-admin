import { useProjectRoute } from '@/hooks/useProjectRoute';
import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl, useParams } from '@umijs/max';
import { Button, Rate, Tag } from 'antd';
import { useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rating: number;
};

const mockMessages: ChatMessage[] = [
  {
    id: 'msg_1',
    role: 'user',
    content: '帮我查一下最近的订单状态。',
    rating: 0,
  },
  {
    id: 'msg_2',
    role: 'assistant',
    content: '好的，请提供订单号，我来帮你查询。',
    rating: 4,
  },
  {
    id: 'msg_3',
    role: 'user',
    content: '订单号是 ORD-20260524-001。',
    rating: 0,
  },
  {
    id: 'msg_4',
    role: 'assistant',
    content: '订单 ORD-20260524-001 已发货，预计 2 个工作日内送达。',
    rating: 0,
  },
];

const ChatDetailPage: React.FC = () => {
  const intl = useIntl();
  const { id } = useParams<{ id: string }>();
  const { toPagePath } = useProjectRoute();
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);

  const handleRate = (messageId: string, rating: number): void => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId ? { ...message, rating } : message,
      ),
    );
  };

  return (
    <PageContainer
      ghost
      header={{
        title: false,
        onBack: () => {
          history.push(toPagePath('chat'));
        },
      }}
    >
      <div className="app-panel space-y-4 p-6">
        <section className="app-card flex flex-wrap items-center gap-3 p-4 text-sm">
          <Tag color="blue">Acme Platform</Tag>
          <Tag>Support Agent</Tag>
          <span className="text-on-surface/70">
            {intl.formatMessage({ id: 'chat.detail.userLabel' }, { email: 'alice@example.com' })}
          </span>
        </section>

        <section className="space-y-3">
          {messages.map((message) => (
            <article key={message.id} className="app-card p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Tag color={message.role === 'user' ? 'default' : 'processing'}>
                  {message.role === 'user'
                    ? intl.formatMessage({ id: 'chat.detail.user' })
                    : intl.formatMessage({ id: 'chat.detail.agent' })}
                </Tag>
                {message.role === 'assistant' ? (
                  <div className="flex items-center gap-2 text-sm text-on-surface/70">
                    <span>{intl.formatMessage({ id: 'chat.detail.rating' })}</span>
                    <Rate
                      value={message.rating}
                      onChange={(value) => {
                        handleRate(message.id, value);
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <p className="text-sm leading-6 text-on-surface">{message.content}</p>
            </article>
          ))}
        </section>

        <div className="flex justify-end">
          <Button type="primary" onClick={() => history.push(toPagePath('chat'))}>
            返回列表
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default ChatDetailPage;
