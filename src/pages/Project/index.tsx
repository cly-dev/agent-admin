import {
  AppListQueryToolbar,
  AppListSearchInput,
} from '@/components/AppQueryPanel';
import ContentEmpty from '@/components/ContentEmpty';
import ListPageHeader from '@/components/ListPageHeader';
import ListPagination from '@/components/ListPagination';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Form, Input, Modal, Spin, Switch } from 'antd';
import ProjectCard from './components/ProjectCard';
import styles from './index.module.scss';
import { useProjectList } from './useProjectList';

const { TextArea } = Input;

const ProjectPage: React.FC = () => {
  const intl = useIntl();
  const {
    list,
    loading,
    keyword,
    setKeyword,
    page,
    pageSize,
    total,
    activeCount,
    isSearchActive,
    showEmpty,
    showPagination,
    onPageChange,
    openDetail,
    openCreate,
    editorOpen,
    editorForm,
    submitting,
    closeEditor,
    submitCreate,
  } = useProjectList();

  return (
    <PageContainer ghost className={styles.projectPage}>
      <div className={styles.projectPageShell}>
        <div className={styles.projectPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'project.list.title' })}
            description={intl.formatMessage({ id: 'project.list.subtitle' })}
            actions={
              <button
                type="button"
                className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]"
                onClick={openCreate}
              >
                <PlusOutlined />
                {intl.formatMessage({ id: 'project.list.add' })}
              </button>
            }
          />

          {!showEmpty ? (
            <section
              className={styles.listIntro}
              aria-label={intl.formatMessage({
                id: 'project.list.overviewLabel',
              })}
            >
              <div className={styles.listIntroBackdrop} aria-hidden>
                <span className={styles.listIntroGrid} />
                <span className={styles.listIntroGlow} />
              </div>
              <div className={styles.listIntroContent}>
                <div className={styles.listIntroCopy}>
                  <p className={styles.listIntroEyebrow}>
                    {intl.formatMessage({ id: 'project.list.overviewEyebrow' })}
                  </p>
                  <p className={styles.listIntroTitle}>
                    {intl.formatMessage({ id: 'project.list.overviewTitle' })}
                  </p>
                  <p className={styles.listIntroDesc}>
                    {isSearchActive
                      ? intl.formatMessage(
                          { id: 'project.list.overviewSearchDesc' },
                          { count: total },
                        )
                      : intl.formatMessage({ id: 'project.list.overviewDesc' })}
                  </p>
                </div>
                <dl className={styles.listStats}>
                  <div className={styles.listStat}>
                    <dt>
                      {intl.formatMessage({ id: 'project.list.stat.total' })}
                    </dt>
                    <dd>{total}</dd>
                  </div>
                  <div
                    className={`${styles.listStat} ${styles.listStatActive}`}
                  >
                    <dt>
                      {intl.formatMessage({ id: 'project.list.stat.active' })}
                    </dt>
                    <dd>{activeCount}</dd>
                  </div>
                </dl>
              </div>
            </section>
          ) : null}

          <AppListQueryToolbar>
            <AppListSearchInput
              className="max-w-md"
              placeholder={intl.formatMessage({ id: 'project.list.search' })}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </AppListQueryToolbar>

          <Spin spinning={loading}>
            <div className={styles.projectPageBody}>
              {showEmpty ? (
                <ContentEmpty
                  title={
                    isSearchActive
                      ? intl.formatMessage({
                          id: 'project.list.emptySearch.title',
                        })
                      : intl.formatMessage({ id: 'project.list.empty.title' })
                  }
                  description={
                    isSearchActive
                      ? intl.formatMessage({
                          id: 'project.list.emptySearch.desc',
                        })
                      : intl.formatMessage({ id: 'project.list.empty.desc' })
                  }
                  action={
                    isSearchActive ? (
                      <button
                        type="button"
                        className="app-button-secondary px-4 py-2 text-sm font-semibold"
                        onClick={() => setKeyword('')}
                      >
                        {intl.formatMessage({ id: 'common.clearSearch' })}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="app-button-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                        onClick={openCreate}
                      >
                        <PlusOutlined />
                        {intl.formatMessage({ id: 'project.list.add' })}
                      </button>
                    )
                  }
                />
              ) : (
                <>
                  <div className={styles.projectCardGrid}>
                    {list.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onOpen={openDetail}
                      />
                    ))}
                  </div>
                  {showPagination ? (
                    <ListPagination
                      page={page}
                      pageSize={pageSize}
                      total={total}
                      onChange={onPageChange}
                    />
                  ) : null}
                </>
              )}
            </div>
          </Spin>
        </div>
      </div>

      <Modal
        className="app-modal"
        title={intl.formatMessage({ id: 'project.createTitle' })}
        open={editorOpen}
        onCancel={closeEditor}
        onOk={() => void submitCreate()}
        confirmLoading={submitting}
        destroyOnClose
        okText={intl.formatMessage({ id: 'project.list.add' })}
        cancelText={intl.formatMessage({ id: 'common.cancel' })}
      >
        <p className={styles.createModalHint}>
          {intl.formatMessage({ id: 'project.createHint' })}
        </p>
        <Form
          form={editorForm}
          layout="vertical"
          requiredMark={false}
          className={styles.createModalForm}
        >
          <Form.Item
            name="name"
            label={intl.formatMessage({ id: 'project.page.name' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'project.form.nameRequired',
                }),
              },
            ]}
          >
            <Input
              className="app-input"
              placeholder={intl.formatMessage({
                id: 'project.page.namePlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label={intl.formatMessage({ id: 'project.page.primaryIntent' })}
          >
            <TextArea
              className="app-input"
              rows={3}
              placeholder={intl.formatMessage({
                id: 'project.page.primaryIntentPlaceholder',
              })}
            />
          </Form.Item>
          <div className={styles.createModalSwitch}>
            <div className={styles.createModalSwitchCopy}>
              <p className={styles.createModalSwitchLabel}>
                {intl.formatMessage({ id: 'project.form.isActive' })}
              </p>
              <p className={styles.createModalSwitchHint}>
                {intl.formatMessage({ id: 'project.detail.statusHint' })}
              </p>
            </div>
            <Form.Item
              name="isActive"
              valuePropName="checked"
              className={styles.createModalSwitchField}
            >
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ProjectPage;
