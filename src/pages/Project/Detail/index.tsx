import { AppDetailPage } from '@/components/AppDetailHeader';
import {
  DeleteOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  PlusOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { history, useIntl, useParams } from '@umijs/max';
import { Empty, Form, Input, Modal, Switch } from 'antd';
import { useMemo } from 'react';
import AddProjectMemberModal from '../components/AddProjectMemberModal';
import EditProjectMemberRoleModal from '../components/EditProjectMemberRoleModal';
import ProjectAuthConfigPanel from '../components/ProjectAuthConfigPanel';
import ProjectMembersTable from '../components/ProjectMembersTable';
import { useProjectAuthConfig } from '../useProjectAuthConfig';
import { useProjectDetail } from '../useProjectDetail';
import { useProjectMembers } from '../useProjectMembers';
import styles from './index.module.scss';

const { TextArea } = Input;

const ProjectDetailPage: React.FC = () => {
  const intl = useIntl();
  const params = useParams<{ id?: string }>();
  const projectId = useMemo(() => Number(params.id), [params.id]);

  const {
    form,
    project,
    loading,
    submitting,
    deleting,
    handleSave,
    handleRemove,
    reload,
  } = useProjectDetail(projectId);

  const {
    form: authForm,
    submitting: authSubmitting,
    testing: authTesting,
    testToken,
    setTestToken,
    testResult,
    useCustomConfig,
    provider,
    rolesLoading,
    authRoleOptions,
    handleSave: handleAuthSave,
    handleTest: handleAuthTest,
    handleOpenChatTest,
  } = useProjectAuthConfig(projectId, project, reload);

  const {
    addForm,
    editRoleForm,
    members,
    loading: membersLoading,
    addModalOpen,
    editRoleModalOpen,
    editingMember,
    submitting: memberSubmitting,
    editRoleSubmitting,
    removingId,
    userOptions,
    roleOptions,
    openAddModal,
    closeAddModal,
    openEditRoleModal,
    closeEditRoleModal,
    handleAddMember,
    handleUpdateMemberRole,
    handleRemoveMember,
  } = useProjectMembers(projectId);

  const watchedName = Form.useWatch('name', form);
  const watchedActive = Form.useWatch('isActive', form);

  const displayName =
    watchedName?.trim() ||
    project?.name ||
    intl.formatMessage({ id: 'project.detail.title' });
  const isActive = watchedActive ?? project?.isActive ?? true;

  const confirmDelete = () => {
    if (!project) return;
    Modal.confirm({
      title: intl.formatMessage({ id: 'project.deleteTitle' }),
      content: intl.formatMessage(
        { id: 'project.deleteDesc' },
        { name: project.name },
      ),
      centered: true,
      okText: intl.formatMessage({ id: 'common.delete' }),
      cancelText: intl.formatMessage({ id: 'common.cancel' }),
      okButtonProps: { danger: true },
      onOk: () => handleRemove(),
    });
  };

  return (
    <AppDetailPage
      loading={loading}
      pageClassName={styles.detailPage}
      bodyClassName={styles.detailBody}
      title={displayName}
      subtitle={
        project
          ? intl.formatMessage(
              { id: 'project.detail.pageSubtitle' },
              { id: project.id },
            )
          : undefined
      }
      onBack={() => history.push('/project')}
      onSave={() => void handleSave(authForm)}
      saveDisabled={!project || deleting}
      saveLoading={submitting || authSubmitting}
      headerBordered={false}
      extraActions={
        project ? (
          <button
            type="button"
            className={styles.deleteBtn}
            disabled={submitting || deleting}
            onClick={confirmDelete}
          >
            <DeleteOutlined />
            {intl.formatMessage({ id: 'common.delete' })}
          </button>
        ) : null
      }
    >
      {!project && !loading ? (
        <Empty
          className={styles.emptyState}
          description={intl.formatMessage({ id: 'project.detail.notFound' })}
        />
      ) : project ? (
        <div className={styles.pageBody}>
          <header className={styles.hero}>
            <div className={styles.heroBackdrop} aria-hidden>
              <span className={styles.heroGrid} />
              <span className={styles.heroGlow} />
            </div>
            <div className={styles.heroContent}>
              <div className={styles.heroLead}>
                <div className={styles.heroAvatar} aria-hidden>
                  <ProjectOutlined />
                </div>
                <div className={styles.heroCopy}>
                  <p className={styles.heroEyebrow}>
                    {intl.formatMessage({
                      id: 'project.detail.workspaceLabel',
                    })}
                  </p>
                  <p className={styles.heroName}>{displayName}</p>
                  <p className={styles.heroDesc}>
                    {intl.formatMessage({ id: 'project.detail.summaryDesc' })}
                  </p>
                </div>
              </div>
              <dl className={styles.heroStats}>
                <div className={styles.statTile}>
                  <dt>{intl.formatMessage({ id: 'project.page.id' })}</dt>
                  <dd className={styles.statMono}>#{project.id}</dd>
                </div>
                <div className={styles.statTile}>
                  <dt>
                    {intl.formatMessage({
                      id: 'project.detail.section.status',
                    })}
                  </dt>
                  <dd>
                    <span
                      className={`${styles.statusPill} ${
                        isActive
                          ? styles.statusPillActive
                          : styles.statusPillMuted
                      }`}
                    >
                      <span className={styles.statusDot} />
                      {intl.formatMessage({
                        id: isActive
                          ? 'project.status.active'
                          : 'project.status.inactive',
                      })}
                    </span>
                  </dd>
                </div>
                <div className={`${styles.statTile} ${styles.statTileWide}`}>
                  <dt>
                    <KeyOutlined />
                    {intl.formatMessage({ id: 'project.detail.dsn' })}
                  </dt>
                  <dd
                    className={styles.statMono}
                    title={project.dsn ?? undefined}
                  >
                    {project.dsn?.trim() ||
                      intl.formatMessage({ id: 'project.detail.dsnEmpty' })}
                  </dd>
                </div>
                <div className={styles.statTile}>
                  <dt>
                    <TeamOutlined />
                    {intl.formatMessage({ id: 'project.members.title' })}
                  </dt>
                  <dd className={styles.statValue}>{members.length}</dd>
                </div>
              </dl>
            </div>
          </header>

          <div className={styles.workspace}>
            <section
              className={styles.zone}
              aria-labelledby="project-zone-general"
            >
              <div className={styles.zoneHead} id="project-zone-general">
                <span className={styles.zoneRail} aria-hidden />
                <div>
                  <p className={styles.zoneEyebrow}>
                    {intl.formatMessage({
                      id: 'project.detail.zone.configuration',
                    })}
                  </p>
                  <h2 className={styles.zoneTitle}>
                    {intl.formatMessage({ id: 'project.page.general' })}
                  </h2>
                </div>
              </div>

              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                preserve={false}
              >
                <div className={styles.configGrid}>
                  <article className={styles.panel}>
                    <header className={styles.panelHeader}>
                      <span className={styles.panelIcon}>
                        <InfoCircleOutlined />
                      </span>
                      <div>
                        <h3 className={styles.panelTitle}>
                          {intl.formatMessage({ id: 'project.page.general' })}
                        </h3>
                        <p className={styles.panelHint}>
                          {intl.formatMessage({
                            id: 'project.page.description',
                          })}
                        </p>
                      </div>
                    </header>

                    <div className={styles.fieldStack}>
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
                          size="large"
                          placeholder={intl.formatMessage({
                            id: 'project.page.namePlaceholder',
                          })}
                        />
                      </Form.Item>

                      <Form.Item
                        name="description"
                        label={intl.formatMessage({
                          id: 'project.page.primaryIntent',
                        })}
                      >
                        <TextArea
                          className="app-input"
                          rows={5}
                          placeholder={intl.formatMessage({
                            id: 'project.page.primaryIntentPlaceholder',
                          })}
                        />
                      </Form.Item>
                    </div>
                  </article>

                  <aside className={styles.sideRail}>
                    <article className={styles.panel}>
                      <header className={styles.panelHeaderCompact}>
                        <h3 className={styles.panelTitle}>
                          {intl.formatMessage({
                            id: 'project.detail.section.status',
                          })}
                        </h3>
                      </header>
                      <div className={styles.switchRow}>
                        <div className={styles.switchCopy}>
                          <p className={styles.switchLabel}>
                            {intl.formatMessage({
                              id: 'project.form.isActive',
                            })}
                          </p>
                          <p className={styles.switchHint}>
                            {intl.formatMessage({
                              id: 'project.detail.statusHint',
                            })}
                          </p>
                        </div>
                        <Form.Item
                          name="isActive"
                          valuePropName="checked"
                          className={styles.switchField}
                        >
                          <Switch />
                        </Form.Item>
                      </div>
                    </article>

                    <article className={`${styles.panel} ${styles.metaPanel}`}>
                      <h3 className={styles.metaTitle}>
                        {intl.formatMessage({
                          id: 'project.detail.section.meta',
                        })}
                      </h3>
                      <dl className={styles.metaList}>
                        <div className={styles.metaItem}>
                          <dt>
                            {intl.formatMessage({ id: 'project.page.id' })}
                          </dt>
                          <dd>{project.id}</dd>
                        </div>
                        <div className={styles.metaItem}>
                          <dt>
                            {intl.formatMessage({ id: 'project.detail.dsn' })}
                          </dt>
                          <dd className={styles.metaDsn}>
                            {project.dsn?.trim() ||
                              intl.formatMessage({
                                id: 'project.detail.dsnEmpty',
                              })}
                          </dd>
                        </div>
                        <p className={styles.metaDsnHint}>
                          {intl.formatMessage({ id: 'project.detail.dsnHint' })}
                        </p>
                        {project.createdAt ? (
                          <div className={styles.metaItem}>
                            <dt>
                              {intl.formatMessage({
                                id: 'project.detail.createdAt',
                              })}
                            </dt>
                            <dd>{project.createdAt}</dd>
                          </div>
                        ) : null}
                        {project.updatedAt ? (
                          <div className={styles.metaItem}>
                            <dt>
                              {intl.formatMessage({
                                id: 'project.detail.updatedAt',
                              })}
                            </dt>
                            <dd>{project.updatedAt}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </article>
                  </aside>
                </div>
              </Form>
            </section>

            <section
              className={styles.zone}
              aria-labelledby="project-zone-access"
            >
              <div className={styles.zoneHead} id="project-zone-access">
                <span className={styles.zoneRail} aria-hidden />
                <div>
                  <p className={styles.zoneEyebrow}>
                    {intl.formatMessage({ id: 'project.detail.zone.access' })}
                  </p>
                  <h2 className={styles.zoneTitle}>
                    <SafetyCertificateOutlined />
                    {intl.formatMessage({ id: 'project.auth.title' })}
                  </h2>
                </div>
              </div>
              <ProjectAuthConfigPanel
                project={project}
                form={authForm}
                submitting={authSubmitting}
                testing={authTesting}
                testToken={testToken}
                testResult={testResult}
                useCustomConfig={useCustomConfig}
                provider={provider}
                rolesLoading={rolesLoading}
                authRoleOptions={authRoleOptions}
                onTestTokenChange={setTestToken}
                onSave={() => void handleAuthSave()}
                onTest={() => void handleAuthTest()}
                onOpenChatTest={() => void handleOpenChatTest()}
              />
            </section>

            <section
              className={styles.zone}
              aria-labelledby="project-zone-team"
            >
              <div className={styles.zoneHead} id="project-zone-team">
                <span className={styles.zoneRail} aria-hidden />
                <div className={styles.zoneHeadRow}>
                  <div>
                    <p className={styles.zoneEyebrow}>
                      {intl.formatMessage({ id: 'project.detail.zone.team' })}
                    </p>
                    <h2 className={styles.zoneTitle}>
                      <TeamOutlined />
                      {intl.formatMessage({ id: 'project.members.title' })}
                      <span className={styles.membersCount}>
                        {members.length}
                      </span>
                    </h2>
                    <p className={styles.zoneSubtitle}>
                      {intl.formatMessage({ id: 'project.members.subtitle' })}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.addMemberBtn}
                    disabled={membersLoading || memberSubmitting}
                    onClick={openAddModal}
                  >
                    <PlusOutlined />
                    {intl.formatMessage({ id: 'project.members.add' })}
                  </button>
                </div>
              </div>
              <div className={styles.membersPanel}>
                <ProjectMembersTable
                  members={members}
                  loading={membersLoading}
                  removingId={removingId}
                  editingRoleId={editingMember?.id ?? null}
                  onEditRole={openEditRoleModal}
                  onRemove={handleRemoveMember}
                />
              </div>
            </section>
          </div>
        </div>
      ) : null}

      <AddProjectMemberModal
        open={addModalOpen}
        submitting={memberSubmitting}
        form={addForm}
        userOptions={userOptions}
        roleOptions={roleOptions}
        onCancel={closeAddModal}
        onSubmit={() => void handleAddMember()}
      />

      <EditProjectMemberRoleModal
        open={editRoleModalOpen}
        submitting={editRoleSubmitting}
        memberName={
          editingMember?.username ||
          editingMember?.userEmail ||
          `#${editingMember?.userId ?? ''}`
        }
        form={editRoleForm}
        roleOptions={roleOptions}
        onCancel={closeEditRoleModal}
        onSubmit={() => void handleUpdateMemberRole()}
      />
    </AppDetailPage>
  );
};

export default ProjectDetailPage;
