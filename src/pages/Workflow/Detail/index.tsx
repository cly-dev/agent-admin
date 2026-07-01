import { AppDetailPage } from '@/components/AppDetailHeader';
import ContentEmpty from '@/components/ContentEmpty';
import {
  WORKFLOW_DELIVERABLE_OPTIONS,
  WORKFLOW_PROFILE_OPTIONS,
} from '@/pages/Workflow/workflowShared';
import { useIntl } from '@umijs/max';
import { Collapse, Form, Input, InputNumber, Segmented, Select, Switch } from 'antd';
import WorkflowFlowCanvas from '../components/WorkflowFlowCanvas';
import WorkflowPresetPanel from '../components/WorkflowPresetPanel';
import WorkflowRequiredBindingsPanel from '../components/WorkflowRequiredBindingsPanel';
import styles from '../index.module.scss';
import { useWorkflowDetail } from '../useWorkflowDetail';

const WorkflowDetailPage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    currentProject,
    isCreateMode,
    isEditMode,
    workflow,
    loading,
    saving,
    form,
    profile,
    configMode,
    setConfigMode,
    presetForm,
    setPresetForm,
    presetCatalog,
    catalogLoading,
    nodes,
    setNodes,
    toolRows,
    hostToolRows,
    tools,
    hostTools,
    toolsLoading,
    revisions,
    handleToolRequiredChange,
    handleHostToolRequiredChange,
    handleBack,
    handleSave,
  } = useWorkflowDetail();

  const subtitle = currentProject?.name
    ? intl.formatMessage(
        { id: 'workflow.detail.subtitle' },
        { name: currentProject.name },
      )
    : undefined;

  const title = isCreateMode
    ? intl.formatMessage({ id: 'workflow.detail.createTitle' })
    : workflow
      ? intl.formatMessage(
          { id: 'workflow.detail.editTitle' },
          { name: workflow.name },
        )
      : intl.formatMessage({ id: 'workflow.detail.title' });

  const basicsCollapseItems = [
    {
      key: 'basics',
      label: intl.formatMessage({ id: 'workflow.detail.basic' }),
      children: (
        <div className={styles.workflowDetailBasicsBody}>
          <div className={styles.workflowDetailBasicsPrimary}>
            <Form.Item
              name="workflowKey"
              label={intl.formatMessage({ id: 'workflow.column.workflowKey' })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'workflow.form.workflowKeyRequired',
                  }),
                },
              ]}
            >
              <Input
                className="app-input"
                disabled={isEditMode}
                placeholder="skill.order.inquiry"
              />
            </Form.Item>
            <Form.Item
              name="name"
              label={intl.formatMessage({ id: 'workflow.column.name' })}
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'workflow.form.nameRequired',
                  }),
                },
              ]}
            >
              <Input className="app-input" />
            </Form.Item>
            <Form.Item
              name="profile"
              label={intl.formatMessage({ id: 'workflow.column.profile' })}
              rules={[{ required: true }]}
            >
              <Select
                className="app-input"
                disabled={isEditMode}
                options={WORKFLOW_PROFILE_OPTIONS.map((value) => ({
                  value,
                  label: intl.formatMessage({ id: `workflow.profile.${value}` }),
                }))}
              />
            </Form.Item>
            <Form.Item
              name="deliverable"
              label={intl.formatMessage({ id: 'workflow.column.deliverable' })}
              rules={[{ required: true }]}
            >
              <Select
                className="app-input"
                options={WORKFLOW_DELIVERABLE_OPTIONS.map((value) => ({
                  value,
                  label: intl.formatMessage({
                    id: `workflow.deliverable.${value}`,
                  }),
                }))}
              />
            </Form.Item>
          </div>
          <div className={styles.workflowDetailBasicsSecondary}>
            <Form.Item name="sortOrder" label={intl.formatMessage({ id: 'common.sortOrder' })}>
              <InputNumber className="app-input w-full" min={0} />
            </Form.Item>
            <Form.Item
              name="isActive"
              label={intl.formatMessage({ id: 'workflow.column.isActive' })}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="description"
              label={intl.formatMessage({ id: 'common.description' })}
              className={styles.workflowDetailBasicsWide}
            >
              <Input.TextArea className="app-input" autoSize={{ minRows: 1, maxRows: 3 }} />
            </Form.Item>
            <Form.Item
              name="goal"
              label={intl.formatMessage({ id: 'workflow.column.goal' })}
              className={styles.workflowDetailBasicsWide}
            >
              <Input.TextArea className="app-input" autoSize={{ minRows: 1, maxRows: 3 }} />
            </Form.Item>
          </div>
        </div>
      ),
    },
  ];

  return (
    <AppDetailPage
      pageClassName={styles.workflowPage}
      cardClassName={styles.workflowDetailCard}
      bodyClassName={styles.workflowDetailBody}
      loading={loading}
      onBack={handleBack}
      onSave={() => void handleSave()}
      saveDisabled={!projectId || saving}
      saveLoading={saving}
      saveLabel={intl.formatMessage({
        id: isCreateMode ? 'workflow.form.createSubmit' : 'common.save',
      })}
      title={title}
      subtitle={subtitle}
    >
      {!projectId ? (
        <ContentEmpty
          title={intl.formatMessage({ id: 'workflow.empty.noProject.title' })}
          description={intl.formatMessage({
            id: 'workflow.empty.noProject.desc',
          })}
        />
      ) : (
        <Form form={form} layout="vertical" className={styles.workflowDetailLayout}>
          <section className={styles.workflowDetailBasics}>
            <Collapse
              bordered={false}
              defaultActiveKey={isCreateMode ? ['basics'] : []}
              items={basicsCollapseItems}
            />
          </section>

          <div className={styles.workflowDetailWorkspace}>
            <section className={styles.workflowDetailCanvasSection}>
              <div className={styles.workflowConfigModeBar}>
                <Segmented
                  value={configMode}
                  disabled={saving}
                  options={[
                    {
                      value: 'preset',
                      label: intl.formatMessage({ id: 'workflow.configMode.preset' }),
                    },
                    {
                      value: 'nodes',
                      label: intl.formatMessage({ id: 'workflow.configMode.nodes' }),
                    },
                  ]}
                  onChange={(value) => setConfigMode(value as 'preset' | 'nodes')}
                />
                {configMode === 'preset' && isEditMode ? (
                  <p className={styles.workflowConfigModeHint}>
                    {intl.formatMessage({ id: 'workflow.preset.rebuildHint' })}
                  </p>
                ) : null}
              </div>

              {configMode === 'preset' ? (
                <WorkflowPresetPanel
                  profile={profile ?? 'page_action'}
                  value={presetForm}
                  catalog={presetCatalog}
                  catalogLoading={catalogLoading}
                  tools={tools}
                  hostTools={hostTools}
                  toolsLoading={toolsLoading}
                  disabled={saving}
                  onChange={setPresetForm}
                />
              ) : (
                <>
                  <WorkflowFlowCanvas
                    profile={profile ?? 'shared'}
                    nodes={nodes}
                    tools={tools}
                    hostTools={hostTools}
                    toolsLoading={toolsLoading}
                    disabled={saving}
                    onChange={setNodes}
                  />
                  <WorkflowRequiredBindingsPanel
                    toolRows={toolRows}
                    hostToolRows={hostToolRows}
                    tools={tools}
                    hostTools={hostTools}
                    disabled={saving}
                    onToolRequiredChange={handleToolRequiredChange}
                    onHostToolRequiredChange={handleHostToolRequiredChange}
                  />
                </>
              )}
            </section>

            <aside className={styles.workflowDetailAside}>
              {isEditMode && workflow ? (
                <section className={styles.workflowAsidePanel}>
                  <h2 className={styles.workflowAsideTitle}>
                    {intl.formatMessage({ id: 'workflow.detail.meta' })}
                  </h2>
                  <dl className={styles.workflowMetaList}>
                    <div className={styles.workflowMetaItem}>
                      <dt>{intl.formatMessage({ id: 'workflow.column.version' })}</dt>
                      <dd>v{workflow.version}</dd>
                    </div>
                    <div className={styles.workflowMetaItem}>
                      <dt>{intl.formatMessage({ id: 'workflow.column.refs' })}</dt>
                      <dd>
                        {intl.formatMessage(
                          { id: 'workflow.column.refsValue' },
                          {
                            skills: workflow.skillRefCount,
                            pageActions: workflow.pageActionRefCount,
                          },
                        )}
                      </dd>
                    </div>
                    <div className={styles.workflowMetaItem}>
                      <dt>{intl.formatMessage({ id: 'workflow.column.nodeCount' })}</dt>
                      <dd>{nodes.length}</dd>
                    </div>
                  </dl>
                </section>
              ) : null}

              {isEditMode ? (
                <section className={styles.workflowAsidePanel}>
                  <h2 className={styles.workflowAsideTitle}>
                    {intl.formatMessage({ id: 'workflow.detail.changeNote' })}
                  </h2>
                  <Form.Item name="changeNote" className="mb-0">
                    <Input.TextArea
                      className="app-input"
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      placeholder={intl.formatMessage({
                        id: 'workflow.detail.changeNotePlaceholder',
                      })}
                    />
                  </Form.Item>
                </section>
              ) : null}

              {revisions.length > 0 ? (
                <section className={styles.workflowAsidePanel}>
                  <h2 className={styles.workflowAsideTitle}>
                    {intl.formatMessage({ id: 'workflow.detail.revisions' })}
                  </h2>
                  <ul className={styles.revisionList}>
                    {revisions.map((revision) => (
                      <li key={revision.id} className={styles.revisionItem}>
                        <span className={styles.revisionVersion}>v{revision.version}</span>
                        <span className={styles.revisionDate}>{revision.createdAt}</span>
                        {revision.changeNote ? (
                          <span className={styles.revisionNote}>{revision.changeNote}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </aside>
          </div>
        </Form>
      )}
    </AppDetailPage>
  );
};

export default WorkflowDetailPage;
