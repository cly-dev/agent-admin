import ContentEmpty from '@/components/ContentEmpty';
import ListPageHeader from '@/components/ListPageHeader';
import {
  AppTable,
  AppTableBooleanStatusCell,
  AppTableButton,
  AppTableCodeCell,
  AppTableMuted,
  AppTablePrimaryCell,
} from '@/components/AppTable';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Alert, Drawer, Form, Input, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FlowMigrationCandidate } from '@/types/flow';
import styles from '../../Workflow/index.module.scss';
import { useFlowMigrate } from './useFlowMigrate';

const FlowMigratePage: React.FC = () => {
  const intl = useIntl();
  const {
    projectId,
    loading,
    candidates,
    selected,
    preview,
    previewLoading,
    migrating,
    form,
    openPreview,
    refreshPreview,
    confirmMigrate,
    closePreview,
    goToList,
  } = useFlowMigrate();

  const columns: ColumnsType<FlowMigrationCandidate> = [
    {
      title: intl.formatMessage({ id: 'flow.migrate.column.name' }),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <AppTablePrimaryCell
          title={name}
          meta={<AppTableCodeCell value={record.workflowKey} />}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'flow.migrate.column.profile' }),
      dataIndex: 'profile',
      key: 'profile',
      width: 120,
      render: (profile: string) =>
        intl.formatMessage({
          id: `workflow.profile.${profile}`,
          defaultMessage: profile,
        }),
    },
    {
      title: intl.formatMessage({ id: 'flow.migrate.column.refs' }),
      key: 'refs',
      width: 160,
      render: (_, record) => (
        <span>
          Skill {record.skillRefCount} · PA {record.pageActionRefCount}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: 'flow.column.isActive' }),
      dataIndex: 'isActive',
      width: 90,
      render: (active: boolean) => (
        <AppTableBooleanStatusCell
          value={active}
          activeLabel={intl.formatMessage({ id: 'common.active' })}
          inactiveLabel={intl.formatMessage({ id: 'common.inactive' })}
        />
      ),
    },
    {
      title: intl.formatMessage({ id: 'common.actions' }),
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <AppTableButton
          onClick={(event) => {
            event.stopPropagation();
            void openPreview(record);
          }}
        >
          {intl.formatMessage({ id: 'flow.migrate.preview' })}
        </AppTableButton>
      ),
    },
  ];

  return (
    <PageContainer ghost className={styles.workflowPage}>
      <div className={styles.workflowPageShell}>
        <div className={styles.workflowPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'flow.migrate.title' })}
            description={intl.formatMessage({ id: 'flow.migrate.subtitle' })}
            actions={
              <button
                type="button"
                className={`app-button-secondary ${styles.headerSecondaryAction}`}
                onClick={goToList}
              >
                {intl.formatMessage({ id: 'flow.migrate.backToFlows' })}
              </button>
            }
          />

          <div className={styles.workflowPageBody}>
            {!projectId ? (
              <ContentEmpty
                title={intl.formatMessage({
                  id: 'flow.empty.noProject.title',
                })}
                description={intl.formatMessage({
                  id: 'flow.empty.noProject.desc',
                })}
              />
            ) : candidates.length === 0 && !loading ? (
              <ContentEmpty
                title={intl.formatMessage({
                  id: 'flow.migrate.emptyTitle',
                })}
                description={intl.formatMessage({
                  id: 'flow.migrate.emptyDesc',
                })}
              />
            ) : (
              <AppTable<FlowMigrationCandidate>
                rowKey="workflowId"
                loading={loading}
                columns={columns}
                dataSource={candidates}
                pagination={false}
              />
            )}
          </div>
        </div>
      </div>

      <Drawer
        title={
          selected
            ? intl.formatMessage(
                { id: 'flow.migrate.drawerTitle' },
                { name: selected.name },
              )
            : intl.formatMessage({ id: 'flow.migrate.preview' })
        }
        width={520}
        open={Boolean(selected)}
        onClose={closePreview}
        destroyOnClose
      >
        {previewLoading && !preview ? (
          <AppTableMuted>
            {intl.formatMessage({ id: 'common.loading' })}
          </AppTableMuted>
        ) : null}

        {preview ? (
          <div className="space-y-4">
            {preview.lossy ? (
              <Alert
                type="warning"
                showIcon
                message={intl.formatMessage({ id: 'flow.migrate.lossy' })}
              />
            ) : null}
            {!preview.flowKeyAvailable ? (
              <Alert
                type="error"
                showIcon
                message={intl.formatMessage({
                  id: 'flow.migrate.flowKeyTaken',
                })}
              />
            ) : null}
            {preview.error ? (
              <Alert
                type="error"
                showIcon
                message={preview.error.message || preview.error.code}
              />
            ) : null}
            {preview.warnings.length > 0 ? (
              <Alert
                type="info"
                showIcon
                message={intl.formatMessage({ id: 'flow.migrate.warnings' })}
                description={
                  <ul className="mb-0 pl-4">
                    {preview.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-on-surface/45">
                {intl.formatMessage({ id: 'flow.migrate.matchedPattern' })}
              </dt>
              <dd>{preview.matchedPattern || '—'}</dd>
              <dt className="text-on-surface/45">
                {intl.formatMessage({ id: 'flow.migrate.rebindSummary' })}
              </dt>
              <dd>
                {intl.formatMessage(
                  { id: 'flow.migrate.rebindValue' },
                  {
                    skill: preview.rebind.skillCount,
                    page: preview.rebind.pageActionCount,
                  },
                )}
              </dd>
            </dl>

            <Form form={form} layout="vertical">
              <Form.Item
                name="flowKey"
                label={intl.formatMessage({ id: 'flow.form.flowKey' })}
                rules={[{ required: true }]}
              >
                <Input
                  className="app-input"
                  onBlur={() => void refreshPreview()}
                />
              </Form.Item>
              <Form.Item
                name="rebindBindings"
                label={intl.formatMessage({
                  id: 'flow.migrate.rebindBindings',
                })}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                name="deactivateSource"
                label={intl.formatMessage({
                  id: 'flow.migrate.deactivateSource',
                })}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                name="changeNote"
                label={intl.formatMessage({ id: 'flow.form.changeNote' })}
              >
                <Input className="app-input" />
              </Form.Item>
            </Form>

            {preview.intent ? (
              <div>
                <div className="mb-1 text-xs font-semibold text-on-surface/60">
                  {intl.formatMessage({ id: 'flow.migrate.intentPreview' })}
                </div>
                <pre className="max-h-48 overflow-auto rounded-lg border border-black/8 bg-black/[0.02] p-2 text-[11px]">
                  {JSON.stringify(preview.intent, null, 2)}
                </pre>
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="app-button-secondary px-3 py-1.5 text-sm font-semibold"
                onClick={closePreview}
              >
                {intl.formatMessage({ id: 'common.cancel' })}
              </button>
              <button
                type="button"
                className="app-button-primary px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                disabled={!preview.canMigrate || migrating || previewLoading}
                onClick={() => void confirmMigrate()}
              >
                {migrating
                  ? intl.formatMessage({ id: 'common.saving' })
                  : intl.formatMessage({ id: 'flow.migrate.confirm' })}
              </button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default FlowMigratePage;
