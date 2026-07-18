import { AppDetailPage } from '@/components/AppDetailHeader';
import ContentEmpty from '@/components/ContentEmpty';
import WorkflowPresetPanel from '@/pages/Workflow/components/WorkflowPresetPanel';
import { history, useIntl } from '@umijs/max';
import {
  Alert,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
} from 'antd';
import styles from '../../Workflow/index.module.scss';
import FlowComposerSection from '../components/FlowComposerSection';
import { FlowPageContextGlobalHint } from '../components/FlowContextUsageHints';
import FlowIntentEditor from '../components/FlowIntentEditor';
import IntentFlowCanvas from '../components/IntentFlowCanvas';
import { useFlowDetail } from '../useFlowDetail';

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value);
  }
}

const FlowDetailPage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    currentProject,
    isCreateMode,
    isEditMode,
    flow,
    loading,
    saving,
    form,
    profile,
    editSurface,
    configMode,
    setConfigMode,
    presetForm,
    setPresetForm,
    presetCatalog,
    catalogLoading,
    intentDraft,
    setIntentDraft,
    tools,
    hostTools,
    toolsLoading,
    revisionOptions,
    selectedVersion,
    revisionLoading,
    isViewingHistory,
    displayIntent,
    displayIr,
    showBindGuide,
    bindEntry,
    allowsMutate,
    dismissBindGuide,
    openPresetRebuild,
    openIntentEdit,
    cancelEditSurface,
    handleVersionSelect,
    resetToCurrentVersion,
    handlePrimaryAction,
    handleBack,
  } = useFlowDetail();

  const editingDisabled = isViewingHistory || saving;
  const viewedVersion = selectedVersion;
  const inEditComposer =
    isEditMode && (editSurface === 'preset' || editSurface === 'intent');

  const basicsFields = (
    <div className="grid gap-x-4 md:grid-cols-2">
      <Form.Item
        name="flowKey"
        label={intl.formatMessage({ id: 'flow.form.flowKey' })}
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'flow.form.flowKeyRequired',
            }),
          },
        ]}
      >
        <Input
          className="app-input"
          disabled={!isCreateMode || editingDisabled}
          placeholder="page.review.autofill"
          maxLength={200}
        />
      </Form.Item>
      <Form.Item
        name="name"
        label={intl.formatMessage({ id: 'flow.form.name' })}
        rules={[
          {
            required: true,
            message: intl.formatMessage({ id: 'flow.form.nameRequired' }),
          },
        ]}
      >
        <Input
          className="app-input"
          disabled={editingDisabled || (isEditMode && inEditComposer)}
          maxLength={200}
        />
      </Form.Item>
      <Form.Item name="profile" hidden>
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label={intl.formatMessage({ id: 'flow.form.description' })}
        className="md:col-span-2"
      >
        <Input.TextArea
          className="app-input"
          rows={2}
          disabled={editingDisabled || inEditComposer}
        />
      </Form.Item>
      <Form.Item
        name="goal"
        label={intl.formatMessage({ id: 'flow.form.goal' })}
        className="md:col-span-2"
      >
        <Input.TextArea
          className="app-input"
          rows={2}
          disabled={editingDisabled || inEditComposer}
        />
      </Form.Item>
      {!isCreateMode ? (
        <>
          <Form.Item
            name="isActive"
            label={intl.formatMessage({ id: 'flow.form.isActive' })}
            valuePropName="checked"
          >
            <Switch disabled={editingDisabled || inEditComposer} />
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label={intl.formatMessage({ id: 'flow.form.sortOrder' })}
          >
            <InputNumber
              className="app-input w-full"
              disabled={editingDisabled || inEditComposer}
            />
          </Form.Item>
        </>
      ) : null}
      {isEditMode && !inEditComposer ? (
        <Form.Item
          name="changeNote"
          label={intl.formatMessage({ id: 'flow.form.changeNote' })}
          className="md:col-span-2"
        >
          <Input
            className="app-input"
            disabled={editingDisabled}
            placeholder={intl.formatMessage({
              id: 'flow.form.changeNotePlaceholder',
            })}
          />
        </Form.Item>
      ) : null}
      {inEditComposer ? (
        <Form.Item
          name="changeNote"
          label={intl.formatMessage({ id: 'flow.form.changeNote' })}
          className="md:col-span-2"
        >
          <Input
            className="app-input"
            disabled={editingDisabled}
            placeholder={intl.formatMessage({
              id: 'flow.form.changeNotePlaceholder',
            })}
          />
        </Form.Item>
      ) : null}
    </div>
  );

  const primaryLabel = isCreateMode
    ? intl.formatMessage({ id: 'flow.wizard.submit' })
    : inEditComposer
      ? intl.formatMessage({ id: 'common.save' })
      : intl.formatMessage({ id: 'flow.detail.saveMeta' });

  const bindSkill = true;
  const bindPageAction = true;

  return (
    <AppDetailPage
      pageClassName={styles.workflowPage}
      cardClassName={styles.workflowDetailCard}
      bodyClassName={styles.workflowDetailBody}
      loading={loading}
      onBack={handleBack}
      onSave={() => void handlePrimaryAction()}
      // Editing can be done without projectId being ready yet.
      // Keep button enabled for UX; handleSave will still validate projectId.
      saveDisabled={editingDisabled}
      saveLoading={saving}
      saveLabel={primaryLabel}
      extraActions={
        inEditComposer ? (
          <button
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold"
            disabled={saving}
            onClick={cancelEditSurface}
          >
            {intl.formatMessage({ id: 'common.cancel' })}
          </button>
        ) : isEditMode && !isViewingHistory ? (
          <>
            <button
              type="button"
              className="app-button-secondary px-3 py-2 text-sm font-semibold"
              onClick={() => {
                Modal.confirm({
                  title: intl.formatMessage({
                    id: 'flow.detail.rebuildPresetConfirmTitle',
                  }),
                  content: intl.formatMessage({
                    id: 'flow.detail.rebuildPresetConfirmDesc',
                  }),
                  okText: intl.formatMessage({
                    id: 'flow.detail.rebuildPreset',
                  }),
                  cancelText: intl.formatMessage({ id: 'common.cancel' }),
                  onOk: () => {
                    openPresetRebuild();
                  },
                });
              }}
            >
              {intl.formatMessage({ id: 'flow.detail.rebuildPreset' })}
            </button>
            <button
              type="button"
              className="app-button-secondary px-3 py-2 text-sm font-semibold"
              onClick={openIntentEdit}
            >
              {intl.formatMessage({ id: 'flow.detail.editIntent' })}
            </button>
          </>
        ) : null
      }
      title={
        isCreateMode
          ? intl.formatMessage({ id: 'flow.detail.createTitle' })
          : intl.formatMessage(
              { id: 'flow.detail.editTitle' },
              { name: flow?.name ?? '—' },
            )
      }
      subtitle={
        currentProject
          ? intl.formatMessage(
              { id: 'flow.detail.projectHint' },
              { name: currentProject.name },
            )
          : undefined
      }
    >
      {!projectId ? (
        <ContentEmpty
          title={intl.formatMessage({ id: 'flow.empty.noProject.title' })}
          description={intl.formatMessage({
            id: 'flow.empty.noProject.desc',
          })}
        />
      ) : (
        <Form
          form={form}
          layout="vertical"
          className={styles.workflowDetailLayout}
        >
          {showBindGuide && isEditMode ? (
            <Alert
              type="success"
              showIcon
              closable
              onClose={dismissBindGuide}
              className="mb-4"
              message={intl.formatMessage({ id: 'flow.bindGuide.title' })}
              description={
                <div className="mt-2 flex flex-wrap gap-2">
                  {bindPageAction ? (
                    <button
                      type="button"
                      className="app-button-secondary px-3 py-1 text-sm font-semibold"
                      onClick={() =>
                        history.push('/workflow/frontend-tool-flow')
                      }
                    >
                      {intl.formatMessage({ id: 'flow.bindGuide.pageAction' })}
                    </button>
                  ) : null}
                  {bindSkill ? (
                    <button
                      type="button"
                      className="app-button-secondary px-3 py-1 text-sm font-semibold"
                      onClick={() => history.push('/agent/skill')}
                    >
                      {intl.formatMessage({ id: 'flow.bindGuide.skill' })}
                    </button>
                  ) : null}
                </div>
              }
            />
          ) : null}

          {isViewingHistory && viewedVersion ? (
            <Alert
              type="info"
              showIcon
              className={styles.workflowRevisionBanner}
              message={intl.formatMessage(
                { id: 'flow.revision.readonlyBanner' },
                { version: viewedVersion },
              )}
              action={
                <button
                  type="button"
                  className="app-button-secondary px-3 py-1 text-sm font-semibold"
                  onClick={resetToCurrentVersion}
                >
                  {intl.formatMessage({
                    id: 'flow.revision.backToCurrent',
                  })}
                </button>
              }
            />
          ) : null}

          {isCreateMode ? (
            <div className={styles.flowPageCanvas}>
              <section className={styles.flowPanel}>
                <header className={styles.flowPanelHeader}>
                  <p className={styles.flowPanelEyebrow}>
                    {intl.formatMessage({ id: 'flow.panel.identity' })}
                  </p>
                  <h2 className={styles.flowPanelTitle}>
                    {intl.formatMessage({ id: 'flow.detail.basics' })}
                  </h2>
                  <p className={styles.flowPanelDesc}>
                    {intl.formatMessage({ id: 'flow.panel.identityDesc' })}
                  </p>
                </header>
                {basicsFields}
              </section>

              <FlowComposerSection
                profile="shared"
                bindEntry={bindEntry}
                configMode={configMode}
                onConfigModeChange={setConfigMode}
                presetForm={presetForm}
                presetCatalog={presetCatalog}
                catalogLoading={catalogLoading}
                onPresetChange={setPresetForm}
                intentDraft={intentDraft}
                onIntentChange={setIntentDraft}
                tools={tools}
                hostTools={hostTools}
                toolsLoading={toolsLoading}
                disabled={editingDisabled}
                flowName={form.getFieldValue('name')}
              />

              <section
                className={`${styles.flowPanel} ${styles.flowPanelPublish}`}
              >
                <header className={styles.flowPanelHeader}>
                  <p className={styles.flowPanelEyebrow}>
                    {intl.formatMessage({ id: 'flow.panel.publish' })}
                  </p>
                  <h2 className={styles.flowPanelTitle}>
                    {intl.formatMessage({ id: 'flow.panel.publishTitle' })}
                  </h2>
                  <p className={styles.flowPanelDesc}>
                    {intl.formatMessage({ id: 'flow.panel.publishDesc' })}
                  </p>
                </header>
                <div className="grid gap-x-4 md:grid-cols-2">
                  <Form.Item
                    name="isActive"
                    label={intl.formatMessage({ id: 'flow.form.isActive' })}
                    valuePropName="checked"
                  >
                    <Switch disabled={editingDisabled} />
                  </Form.Item>
                  <Form.Item
                    name="sortOrder"
                    label={intl.formatMessage({ id: 'flow.form.sortOrder' })}
                  >
                    <InputNumber
                      className="app-input w-full"
                      disabled={editingDisabled}
                    />
                  </Form.Item>
                </div>
              </section>
            </div>
          ) : (
            <div className={styles.workflowDetailWorkspace}>
              <section className={styles.workflowDetailCanvasSection}>
                {editSurface === 'view' ? (
                  <>
                    <section className={styles.workflowDetailBasics}>
                      <Collapse
                        bordered={false}
                        defaultActiveKey={[]}
                        items={[
                          {
                            key: 'basics',
                            label: intl.formatMessage({
                              id: 'flow.detail.basics',
                            }),
                            children: basicsFields,
                          },
                        ]}
                      />
                    </section>

                    <div className={styles.flowIntentMain}>
                      <h2 className={styles.workflowAsideTitle}>
                        {intl.formatMessage({ id: 'flow.intent.mainTitle' })}
                      </h2>
                      <FlowPageContextGlobalHint className="mb-3" />
                      <IntentFlowCanvas
                        value={displayIntent}
                        profile="shared"
                        bindEntry={bindEntry}
                        tools={tools}
                        hostTools={hostTools}
                        toolsLoading={toolsLoading}
                        disabled
                        onChange={() => undefined}
                      />
                    </div>

                    <Collapse
                      className="mt-4"
                      bordered={false}
                      items={[
                        {
                          key: 'ir',
                          label: intl.formatMessage({ id: 'flow.ir.title' }),
                          children: (
                            <>
                              <p className="mb-2 text-xs text-on-surface/45">
                                {intl.formatMessage({
                                  id: 'flow.ir.readonlyHint',
                                })}
                              </p>
                              <pre className="max-h-[360px] overflow-auto rounded-lg border border-black/8 bg-black/2 p-3 text-xs leading-relaxed">
                                {prettyJson(displayIr)}
                              </pre>
                            </>
                          ),
                        },
                      ]}
                    />
                  </>
                ) : null}

                {editSurface === 'preset' ? (
                  <>
                    <Alert
                      type="info"
                      showIcon
                      className="mb-3"
                      message={intl.formatMessage({
                        id: 'flow.preset.rebuildHint',
                      })}
                    />
                    <WorkflowPresetPanel
                      profile={profile ?? 'shared'}
                      value={presetForm}
                      catalog={presetCatalog}
                      catalogLoading={catalogLoading}
                      tools={tools}
                      hostTools={hostTools}
                      toolsLoading={toolsLoading}
                      disabled={editingDisabled}
                      section="all"
                      productMode="flow"
                      bindEntry={bindEntry}
                      onChange={setPresetForm}
                    />
                    <Form.Item
                      name="changeNote"
                      label={intl.formatMessage({ id: 'flow.form.changeNote' })}
                      className="mt-4"
                    >
                      <Input
                        className="app-input"
                        disabled={editingDisabled}
                        placeholder={intl.formatMessage({
                          id: 'flow.form.changeNotePlaceholder',
                        })}
                      />
                    </Form.Item>
                  </>
                ) : null}

                {editSurface === 'intent' ? (
                  <div className="space-y-3">
                    <FlowPageContextGlobalHint />
                    <FlowIntentEditor
                      value={intentDraft}
                      profile={profile ?? 'shared'}
                      bindEntry={bindEntry}
                      flowName={flow?.name}
                      tools={tools}
                      hostTools={hostTools}
                      toolsLoading={toolsLoading}
                      disabled={editingDisabled}
                      onChange={setIntentDraft}
                    />
                    <Form.Item
                      name="changeNote"
                      label={intl.formatMessage({ id: 'flow.form.changeNote' })}
                    >
                      <Input
                        className="app-input"
                        disabled={editingDisabled}
                        placeholder={intl.formatMessage({
                          id: 'flow.form.changeNotePlaceholder',
                        })}
                      />
                    </Form.Item>
                  </div>
                ) : null}
              </section>

              <aside className={styles.workflowDetailAside}>
                {flow ? (
                  <section className={styles.workflowAsidePanel}>
                    <h2 className={styles.workflowAsideTitle}>
                      {intl.formatMessage({ id: 'flow.detail.meta' })}
                    </h2>
                    <dl className={styles.workflowMetaList}>
                      <div className={styles.workflowMetaItem}>
                        <dt>
                          {intl.formatMessage({ id: 'flow.meta.version' })}
                        </dt>
                        <dd>v{flow.version}</dd>
                      </div>
                      <div className={styles.workflowMetaItem}>
                        <dt>{intl.formatMessage({ id: 'flow.meta.refs' })}</dt>
                        <dd>
                          {intl.formatMessage(
                            { id: 'flow.meta.refsValue' },
                            {
                              skills: flow.skillRefCount,
                              pageActions: flow.pageActionRefCount,
                            },
                          )}
                        </dd>
                      </div>
                    </dl>
                    <Form.Item
                      label={intl.formatMessage({
                        id: 'flow.revision.select',
                      })}
                      className="mt-3 mb-0"
                    >
                      <Select
                        className="app-input w-full"
                        loading={revisionLoading}
                        value={selectedVersion ?? flow.version}
                        options={revisionOptions}
                        onChange={(version) =>
                          void handleVersionSelect(version)
                        }
                      />
                    </Form.Item>
                  </section>
                ) : null}

                {flow ? (
                  <section className={styles.workflowAsidePanel}>
                    <h2 className={styles.workflowAsideTitle}>
                      {intl.formatMessage({ id: 'flow.detail.bindings' })}
                    </h2>
                    <p className="mb-2 text-xs text-on-surface/45">
                      {intl.formatMessage({ id: 'flow.detail.bindingsHint' })}
                    </p>
                    <ul className="m-0 list-none space-y-1 p-0 text-sm">
                      {flow.flowTools.length === 0 &&
                      flow.flowHostTools.length === 0 ? (
                        <li className="text-on-surface/40">—</li>
                      ) : null}
                      {flow.flowTools.map((row) => (
                        <li key={`t-${row.toolId}`}>
                          Tool #{row.toolId}
                          {row.tool?.name ? ` · ${row.tool.name}` : ''}
                        </li>
                      ))}
                      {flow.flowHostTools.map((row) => (
                        <li key={`h-${row.hostToolId}`}>
                          HostTool #{row.hostToolId}
                          {row.hostTool?.name ? ` · ${row.hostTool.name}` : ''}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </aside>
            </div>
          )}
        </Form>
      )}
    </AppDetailPage>
  );
};

export default FlowDetailPage;
