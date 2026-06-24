import ContentEmpty from '@/components/ContentEmpty';
import ListPageHeader from '@/components/ListPageHeader';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import ChatFilter from './components/ChatFilter';
import ChatTable from './components/ChatTable';
import styles from './index.module.scss';
import { useChatList } from './useChatList';

const ChatPage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    filterForm,
    appliedFilters,
    list,
    loading,
    page,
    pageSize,
    total,
    handleFilterSearch,
    handleFilterReset,
    onPageChange,
    detailPath,
  } = useChatList();

  return (
    <PageContainer ghost className={styles.chatPage}>
      <div className={styles.chatPageShell}>
        <div className={styles.chatPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'chat.title' })}
            description={intl.formatMessage({ id: 'chat.subtitle' })}
          />

          <div className={styles.chatPageBody}>
            {!projectId ? (
              <ContentEmpty
                title={intl.formatMessage({ id: 'chat.empty.noProject.title' })}
                description={intl.formatMessage({
                  id: 'chat.empty.noProject.desc',
                })}
              />
            ) : (
              <>
                <ChatFilter
                  form={filterForm}
                  appliedFilters={appliedFilters}
                  loading={loading}
                  onSearch={handleFilterSearch}
                  onReset={handleFilterReset}
                />
                <ChatTable
                  sessions={list}
                  loading={loading}
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={onPageChange}
                  detailPath={detailPath}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ChatPage;
