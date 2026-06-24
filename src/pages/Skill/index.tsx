import ContentEmpty from '@/components/ContentEmpty';
import ListPageHeader from '@/components/ListPageHeader';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import SkillFilter from './components/SkillFilter';
import SkillTable from './components/SkillTable';
import styles from './index.module.scss';
import { useSkillList } from './useSkillList';

const SkillPage: React.FC = () => {
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
    agentOptions,
    agentsLoading,
    openCreate,
    openDetail,
    confirmDelete,
  } = useSkillList();

  return (
    <PageContainer ghost className={styles.skillPage}>
      <div className={styles.skillPageShell}>
        <div className={styles.skillPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'skill.title' })}
            description={intl.formatMessage({ id: 'skill.subtitle' })}
            actions={
              <button
                type="button"
                className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]"
                onClick={openCreate}
                disabled={!projectId}
              >
                <PlusOutlined />
                {intl.formatMessage({ id: 'skill.add' })}
              </button>
            }
          />

          <div className={styles.skillPageBody}>
            <SkillFilter
              form={filterForm}
              appliedFilters={appliedFilters}
              loading={loading}
              projectId={projectId}
              agentOptions={agentOptions}
              agentsLoading={agentsLoading}
              onSearch={handleFilterSearch}
              onReset={handleFilterReset}
            />
            {!projectId ? (
              <ContentEmpty
                title={intl.formatMessage({
                  id: 'skill.empty.noProject.title',
                })}
                description={intl.formatMessage({
                  id: 'skill.empty.noProject.desc',
                })}
              />
            ) : (
              <SkillTable
                list={list}
                loading={loading}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={onPageChange}
                onView={openDetail}
                onDelete={confirmDelete}
              />
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default SkillPage;
